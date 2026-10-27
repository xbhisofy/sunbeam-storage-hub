import { Image, Film, Music, FileText, MoreVertical, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Link } from '@tanstack/react-router';
import { formatSize, formatFileDate } from '@/lib/format';
import type { ReviewFile } from './data';
import lake from './assets/sample-lake.jpg';
import s from './ReferenceScreens.module.css';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const fileKinds = [{ kind: 'pdf', label: 'Documents', icon: FileText }, { kind: 'image', label: 'Images', icon: Image }, { kind: 'video', label: 'Videos', icon: Film }, { kind: 'audio', label: 'Music', icon: Music }] as const;
export function ReviewFileRow({ file, shared = false, compact = false }: { file: ReviewFile; shared?: boolean; compact?: boolean }) {
  const [details, setDetails] = useState(false);
  const category = fileKinds.find(k => k.kind === file.file_type) ?? fileKinds[0];
  const Icon = category.icon;
  const tone = s[category.kind];
  return <article className={`${s.row} ${compact ? s.compact : ''}`}>
    <div className={`${s.thumbnail} ${tone}`}>{file.id === 'sample-photo' ? <img src={lake} alt="Mountain lake" width="54" height="58" loading="lazy" /> : <Icon aria-hidden="true" />}</div>
    <div className={s.name}><strong>{file.name}</strong><small>{formatSize(file.size)} · {formatFileDate(file.created_at)}{!compact && !shared && ` · ${file.name.split('.').pop()?.toUpperCase()}`}</small>{!compact && <span className={`${s.tag} ${shared ? s.expiry : tone}`}>{shared ? <Link2 aria-hidden="true" /> : <Icon aria-hidden="true" />}{shared ? file.expires_at ? Date.parse(file.expires_at) <= Date.now() ? 'Link expired' : `Expires ${formatFileDate(file.expires_at)}` : 'Never expires' : category.label === 'Images' ? 'Image' : category.label === 'Videos' ? 'Video' : category.label === 'Documents' ? 'Document' : 'Music'}</span>}</div>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className={s.menu} aria-label={`Options for ${file.name}`}><MoreVertical aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setDetails(true)}>File details</DropdownMenuItem><DropdownMenuItem asChild><Link to={file.id.startsWith('sample-') ? '/auth' : shared ? '/shared' : '/content'}>{file.id.startsWith('sample-') ? 'Sign in to manage files' : 'Manage file'}</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    <Dialog open={details} onOpenChange={setDetails}><DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md"><DialogTitle className="break-all pr-6">{file.name}</DialogTitle><DialogDescription>File details</DialogDescription><dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm"><dt>Size</dt><dd>{formatSize(file.size)}</dd><dt>Uploaded</dt><dd>{formatFileDate(file.created_at)}</dd><dt>Type</dt><dd>{category.label}</dd><dt>Link expiry</dt><dd>{file.expires_at ? formatFileDate(file.expires_at) : 'Never expires'}</dd></dl></DialogContent></Dialog>
  </article>;
}