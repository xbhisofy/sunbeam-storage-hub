import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { safetyClient, safetyLabel, type SafetyFile } from '@/lib/content-safety';
import { supabase } from '@/integrations/supabase/client';

export function AdminSafety() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<SafetyFile | null>(null);
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: files = [], error } = useQuery({ queryKey: ['admin-safety'], refetchInterval: 10000,
    queryFn: async () => {
      const result = await safetyClient.from('files').select('*').eq('source', 'original').neq('moderation_status', 'approved').order('created_at').limit(100);
      if (result.error) throw result.error;
      return result.data;
    },
  });
  async function review(file: SafetyFile) {
    setSelected(file); setNote(''); setUrl('');
    if (file.scan_status === 'clean' && file.moderation_status !== 'blocked' && file.storage_path) {
      const result = await supabase.storage.from('files').createSignedUrl(file.storage_path, 300);
      if (result.error) toast.error('Review preview unavailable');
      else setUrl(result.data.signedUrl);
    }
  }
  async function decide(decision: 'approved' | 'blocked') {
    if (!selected) return;
    setBusy(true);
    const result = await safetyClient.rpc('admin_review_file', { _id: selected.id, _decision: decision, _note: note.trim() });
    setBusy(false);
    if (result.error) { toast.error(result.error.message); return; }
    toast.success(decision === 'approved' ? 'File approved for sharing' : 'File sharing blocked');
    setSelected(null); setUrl(''); qc.invalidateQueries({ queryKey: ['admin-safety'] }); qc.invalidateQueries({ queryKey: ['files'] });
  }
  return <section className="space-y-4">
    <h2 className="text-lg font-semibold">Content safety review</h2>
    {error && <p className="text-sm text-destructive">Safety queue unavailable. Files remain restricted.</p>}
    <div className="divide-y border-y">{files.map(file => <div key={file.id} className="flex items-center gap-3 py-4">
      <div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{safetyLabel(file)} · Antivirus: {file.scan_status}</p><p className="text-xs text-muted-foreground">{file.moderation_note}</p></div>
      <Button variant="outline" onClick={() => review(file)}>Review</Button>
    </div>)}</div>
    {!files.length && !error && <p className="text-sm text-muted-foreground">No files awaiting review.</p>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setUrl(''); } }}><DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>Review the complete content before approval. Do not download or redistribute suspected child abuse material.</DialogDescription></DialogHeader>
      {url && selected?.file_type === 'image' && <img src={url} alt="Content under review" className="max-h-80 w-full object-contain" />}
      {url && selected?.file_type === 'video' && <video src={url} controls className="max-h-80 w-full" />}
      {url && selected?.file_type === 'audio' && <audio src={url} controls className="w-full" />}
      {url && selected?.file_type === 'pdf' && <iframe title="Document review" src={url} sandbox="" className="h-80 w-full border" />}
      <Textarea aria-label="Review reason" placeholder="Record your review findings" value={note} onChange={e => setNote(e.target.value)} maxLength={1000} />
      <div className="flex gap-2"><Button variant="destructive" disabled={busy || note.trim().length < 3} onClick={() => decide('blocked')}>Block sharing</Button>
      <Button disabled={busy || note.trim().length < 3 || !url || selected?.scan_status !== 'clean' || selected?.moderation_status === 'blocked'} onClick={() => decide('approved')}>Approve after review</Button></div>
    </DialogContent></Dialog>
  </section>;
}