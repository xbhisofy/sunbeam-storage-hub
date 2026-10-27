import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Search, SlidersHorizontal, Folder, Clock, ArrowDownUp, FileText, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewScreen } from './data';
import type { ReviewAccount } from './sample-account';
import { ProfilePreview } from './ProfilePreview';
import { UploadPreview } from './UploadPreview';
import { ReviewFileRow, fileKinds } from './ReviewFileRow';
import art from './assets/shared-folders.png';
import s from './ReferenceScreens.module.css';

export function ScreensPreview({ screen, account, loading, error, signedIn, refresh, initialKind }: { screen: Exclude<ReviewScreen, 'home'>; account: ReviewAccount | null | undefined; loading: boolean; error: boolean; signedIn: boolean; refresh: () => void; initialKind?: string | undefined }) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState(initialKind ?? 'all');
  const [sort, setSort] = useState('recent');
  const [showSort, setShowSort] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  if (screen === 'profile') return <ProfilePreview account={account} signedIn={signedIn} />;
  if (screen === 'upload') return <UploadPreview signedIn={signedIn} />;
  const shared = screen === 'shared';
  const files = account?.files ?? [];
  const base = shared ? files.filter(f => !!f.slug) : files;
  const shown = base.filter(f => (kind === 'all' || f.file_type === kind) && f.name.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'size' ? b.size-a.size : sort === 'date' ? Date.parse(a.created_at)-Date.parse(b.created_at) : Date.parse(b.created_at)-Date.parse(a.created_at));
  const categories = [{ kind: 'all', label: 'All', icon: Folder }, ...(shared ? [fileKinds[1],fileKinds[2],fileKinds[0],fileKinds[3]] : fileKinds)];
  return <div className={shared ? s.shared : ''}>
    <header className={s.heading}><small>{shared ? 'TANYORA' : 'MY LIBRARY'}</small><h1>{shared ? 'Shared' : 'My'} <span>{shared ? 'Links' : 'Files'}</span></h1><p>{shared ? "Manage all the files you've shared with others." : 'Manage and access all your files in one place.'}</p>{shared ? <img src={art} alt="" width="104" height="92" /> : <Button variant="ghost" className={s.searchAction} aria-label="Focus file search" onClick={() => input.current?.focus()}><Search aria-hidden="true" /></Button>}</header>
    <div className={s.search}><label><Search aria-hidden="true" /><input ref={input} aria-label={shared ? 'Search shared links' : 'Search My Files'} placeholder={shared ? 'Search shared files...' : 'Search files...'} value={search} onChange={e => setSearch(e.target.value)} /></label><Button variant="ghost" className={s.filter} aria-label="Toggle sorting" aria-pressed={showSort} onClick={() => setShowSort(v => !v)}><SlidersHorizontal aria-hidden="true" /></Button></div>
    <div className={s.chips}>{categories.map(({ kind: k, label, icon: Icon }) => <Button key={k} variant="ghost" className={`${s.chip} ${k === kind ? s.selected : ''}`} aria-pressed={k===kind} onClick={() => setKind(k)}><span className={`${s.chipIcon} ${k === 'all' ? '' : s[k as 'pdf'|'image'|'video'|'audio']}`}><Icon aria-hidden="true" /></span><span>{label}<small>{base.filter(f => k === 'all' || f.file_type === k).length}</small></span></Button>)}</div>
    {(!shared || showSort) && <div className={s.sort} aria-label="Sort files">{[{ value:'recent',label:'Recent',icon:Clock },{ value:'name',label:'Name',icon:ArrowDownUp },{ value:'size',label:'Size',icon:FileText },{ value:'date',label:'Date',icon:CalendarDays }].map(({ value,label,icon:Icon }) => <Button key={value} variant="ghost" className={`${s.sortButton} ${sort===value ? s.selectedSort : ''}`} aria-pressed={sort===value} onClick={() => setSort(value)}><Icon aria-hidden="true" />{label}</Button>)}</div>}
    {loading ? <div className={s.empty} role="status">Loading your files…</div> : error ? <div className={s.empty} role="alert"><p>Could not load your files.</p><Button variant="outline" onClick={refresh}>Try again</Button></div> : shown.length ? <div className={s.list}>{shown.map(file => <ReviewFileRow key={file.id} file={file} shared={shared} />)}</div> : <div className={s.empty}>{shared && <img src={art} alt="" width="140" height="110" />}<h2>{search || kind !== 'all' ? 'No matching files' : shared ? 'No shared links yet' : 'No files yet'}</h2><p>{shared ? 'When you share a file, it will appear here.' : 'Your uploaded files will appear here.'}</p><Button asChild className={s.cta}><Link to="/mobileapp" search={{ screen:'upload' }}>{shared ? 'Share a File' : 'Upload a file'}</Link></Button></div>}
  </div>;
}
