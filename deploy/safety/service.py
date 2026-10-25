"""VPS-only service. Never import this module into the web/Worker application."""
import json
import os
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

import psycopg2
import requests
from policy import MAX_SCAN_BYTES, dangerous_signature, restriction, scan_result


def db():
    return psycopg2.connect(host=os.environ['SAFETY_DB_HOST'], port=5432, dbname='postgres', user='postgres', password=os.environ['POSTGRES_PASSWORD'], connect_timeout=5)


def decide(path, status, note):
    with db() as conn, conn.cursor() as cur:
        cur.execute("UPDATE public.files SET scan_status=%s, scanned_at=now(), moderation_status=CASE WHEN %s='clean' THEN moderation_status ELSE 'blocked' END, moderation_note=%s WHERE storage_path=%s", (status, status, note, path))
        cur.execute("INSERT INTO public.content_safety_events(file_id,action,note) SELECT id,%s,%s FROM public.files WHERE storage_path=%s AND source='original'", ('scan_' + status, note, path))


def scan_one():
    with db() as conn, conn.cursor() as cur:
        cur.execute("SELECT id,storage_path,name,size FROM public.files WHERE source='original' AND scan_status='pending' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED")
        row = cur.fetchone()
        if row is None:
            return False
        fid, path, name, size = row
        cur.execute("UPDATE public.files SET scan_status='scanning',scanned_at=now() WHERE id=%s", (fid,))
    issue = restriction(name, size)
    if issue or not path:
        decide(path, 'unsupported', issue or 'Missing uploaded file')
        return True
    key = os.environ['SERVICE_ROLE_KEY']
    with tempfile.NamedTemporaryFile() as temporary:
        try:
            from urllib.parse import quote
            with requests.get('http://127.0.0.1:8000/storage/v1/object/authenticated/files/' + quote(path, safe='/'), headers={'apikey': key, 'Authorization': 'Bearer ' + key}, stream=True, timeout=(10, 90)) as response:
                response.raise_for_status()
                total = 0
                prefix = b''
                for chunk in response.iter_content(65536):
                    if not prefix:
                        prefix = chunk[:32]
                    total += len(chunk)
                    if total > MAX_SCAN_BYTES:
                        decide(path, 'unsupported', 'File exceeds antivirus scan limit')
                        return True
                    temporary.write(chunk)
                if total != size:
                    decide(path, 'error', 'Stored file size does not match upload metadata')
                    return True
                if dangerous_signature(prefix):
                    decide(path, 'unsupported', 'Executable or archive disguised as another file type')
                    return True
            temporary.flush()
            # Stream bytes across the daemon socket; services use isolated /tmp namespaces.
            result = subprocess.run(['clamdscan', '--stream', '--no-summary', temporary.name], capture_output=True, text=True, timeout=180)
            status = scan_result(result.returncode, result.stdout)
            decide(path, status, 'Malware scan complete; content review required' if status == 'clean' else 'Malware detected' if status == 'infected' else 'Antivirus check unavailable; sharing blocked')
        except Exception:
            decide(path, 'error', 'Safety checking failed; sharing blocked')
    return True


def worker():
    # Interrupted scans never become implicitly clean.
    while True:
        try:
            with db() as conn, conn.cursor() as cur:
                cur.execute("UPDATE public.files SET scan_status='pending' WHERE scan_status='scanning' AND scanned_at<now()-interval '10 minutes'")
            if not scan_one():
                time.sleep(5)
        except Exception:
            time.sleep(15)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # Never log signed URLs or tokens.

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'ok')
            return
        path = urlsplit(self.headers.get('X-Original-URI', '')).path
        status = 403
        try:
            # Guard every object/render delivery path including issued-before-rollout URLs.
            pieces = unquote(path).split('/files/', 1)
            if len(pieces) != 2 or not pieces[1] or '\x00' in pieces[1]:
                raise ValueError('Invalid object path')
            storage_path = pieces[1]
            with db() as conn, conn.cursor() as cur:
                cur.execute("SELECT EXISTS (SELECT 1 FROM public.files WHERE storage_path=%s AND public.file_is_shareable(id))", (storage_path,))
                allowed = cur.fetchone()[0]
                if not allowed:
                    # Allow clean review media only for a verified admin bearer or admin-signed URL.
                    token = self.headers.get('Authorization', '').removeprefix('Bearer ')
                    query = urlsplit(self.headers.get('X-Original-URI', '')).query
                    from urllib.parse import parse_qs
                    token = token or parse_qs(query).get('token', [''])[0]
                    if token:
                        import base64
                        import hashlib
                        import hmac
                        parts = token.split('.')
                        if len(parts) == 3:
                            signing = (parts[0] + '.' + parts[1]).encode()
                            expected = base64.urlsafe_b64encode(hmac.new(os.environ['JWT_SECRET'].encode(), signing, hashlib.sha256).digest()).rstrip(b'=').decode()
                            if hmac.compare_digest(expected, parts[2]):
                                claims = json.loads(base64.urlsafe_b64decode(parts[1] + '=' * (-len(parts[1]) % 4)))
                                subject = claims.get('sub')
                                scoped = claims.get('url') == 'files/' + storage_path if 'url' in claims else claims.get('role') == 'authenticated'
                                if scoped and subject and claims.get('exp', 0) > time.time():
                                    cur.execute("SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=%s AND role='admin') AND EXISTS (SELECT 1 FROM public.files WHERE storage_path=%s AND scan_status='clean' AND moderation_status<>'blocked')", (subject, storage_path))
                                    allowed = cur.fetchone()[0]
                status = 204 if allowed else 403
        except Exception:
            status = 403
        self.send_response(status)
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()


if __name__ == '__main__':
    threading.Thread(target=worker, daemon=True).start()
    ThreadingHTTPServer(('127.0.0.1', 3199), Handler).serve_forever()
