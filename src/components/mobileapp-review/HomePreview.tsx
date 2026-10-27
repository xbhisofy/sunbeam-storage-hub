import { Link } from '@tanstack/react-router';
import { Bell, Search, Sun, Cloud, CloudUpload, Folder, ScanLine, ChevronRight, Award, FileText, Image as ImageIcon, Film, Music, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileDate, formatSize } from '@/lib/format';
import { currentPlan } from '../../../mobile/lib/account-rules';
import cloudArt from '../../../mobile/assets/home-cloud.png';
import logo from '../../../mobile/assets/icon.png';
import { type ReviewScreen } from './data';
import s from './mobileapp-review.module.css';

// Props remain read-only; no native picker, file sharing or account mutations enter this route.
export function HomePreview({ account, signedIn, loading, error, refresh }: {
  account: { profile: { display_name: string | null; email: string | null; premium_tier: string | null; premium_until: string | null }; files: import('./data').ReviewFile[] } | null | undefined;
  signedIn: boolean; loading: boolean; error: boolean; refresh: () => void;
}) {
  const plan = currentPlan(account?.profile ?? null);
  const files = account?.files ?? [];
  const known = !!account;
  const name = account?.profile.display_name?.split(' ')[0] || 'there';
  const used = files.reduce((total, file) => total + (file.size || 0), 0);
  const percent = Math.min(100, used / plan.storage * 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const categories = [
    { kind: 'pdf', label: 'Documents', icon: FileText }, { kind: 'image', label: 'Images', icon: ImageIcon },
    { kind: 'video', label: 'Videos', icon: Film }, { kind: 'audio', label: 'Music', icon: Music },
  ];
  const destination = (screen: ReviewScreen, label: string, className: string, children: React.ReactNode) =>
    <Button asChild variant="ghost" className={className}><Link to="/mobileapp" search={{ screen }} aria-label={label}>{children}</Link></Button>;
  return <>
    <header className={s.header}>
      <div className={s.brand}><img src={logo} alt="" /><div><strong>Tanyora</strong><small>Cloud for Everyone</small></div></div>
      <div className={s.headerActions}>
        {destination('files', 'Search files', s.iconButton, <Search aria-hidden="true" />)}
        <Button disabled title="Notifications unavailable in browser review" aria-label="Notifications unavailable" variant="ghost" className={s.iconButton}><Bell aria-hidden="true" /></Button>
        {destination('profile', 'Open profile', `${s.iconButton} ${s.avatar}`, known ? name.charAt(0).toUpperCase() : <span>–</span>)}
      </div>
    </header>
    <section className={s.intro}><img src={cloudArt} alt="" width="112" height="112" /><div className={s.greeting}>{greeting}, {name}<Sun aria-hidden="true" /></div><h1>Your files, <span>your space.</span></h1><p>Upload, manage, and share everything easily.</p></section>
    <section className={s.storage} aria-label="Cloud storage">
      <div className={s.storageHeader}><h2><Cloud aria-hidden="true" />Cloud Storage</h2>{destination('profile', 'View profile', s.plan, <><Award aria-hidden="true" />{known ? `${plan.name} Plan` : '—'}<ChevronRight aria-hidden="true" /></>)}</div>
      <p className={s.used}>{known ? formatSize(used) : '—'}</p><p className={s.capacity}>{known ? `of ${plan.storage / 1024 ** 3} GB used` : 'Storage details unavailable'}</p>
      <div className={s.progressRow}><progress aria-label="Cloud storage used" max={100} value={known ? percent : 0} /><span>{known ? `${Math.round(percent)}%` : '—'}</span></div>
      <div className={s.actions}>{destination('upload', 'Upload & Share', s.upload, <><CloudUpload aria-hidden="true" />Upload &amp; Share<ChevronRight aria-hidden="true" /></>)}<Button disabled title="New Folder unavailable" variant="ghost" className={s.utility}><Folder aria-hidden="true" />New Folder</Button><Button disabled title="Scan unavailable" variant="ghost" className={s.utility}><ScanLine aria-hidden="true" />Scan</Button></div>
    </section>
    <section className={s.categories} aria-label="File categories">{categories.map(({ kind, label, icon: Icon }) => <Button asChild variant="ghost" className={s.category} key={kind}><Link to="/mobileapp" search={{ screen: 'files' }} aria-label={`${label}, ${known ? files.filter(f => f.file_type === kind).length : 'unavailable'} files`}><span className={`${s.categoryIcon} ${s[kind as 'pdf' | 'image' | 'video' | 'audio']}`}><Icon aria-hidden="true" /></span><strong>{label}</strong><span className={s.categoryBottom}>{known ? `${files.filter(f => f.file_type === kind).length} files` : '—'}<ChevronRight aria-hidden="true" /></span></Link></Button>)}</section>
    <section className={s.recent}><div className={s.recentHeader}><h2>Recent Files</h2>{destination('files', 'View all files', s.textLink, <>View all<ChevronRight aria-hidden="true" /></>)}</div>
      {!signedIn ? <div className={s.message}><Cloud aria-hidden="true" /><h2>Sign in to view your files</h2><p>Reopen this page after signing in.</p><Button asChild className={s.secondary} variant="outline"><Link to="/auth">Sign in</Link></Button></div> : loading ? <div className={s.message} role="status">Loading your files…</div> : error ? <div className={s.message} role="alert"><p>Could not load your account and files.</p><Button onClick={refresh} variant="outline" className={s.secondary}>Try again</Button></div> : files.length ? <div className={s.fileList}>{files.slice(0, 3).map(file => {
        const kind = categories.find(c => c.kind === file.file_type)?.kind ?? 'pdf';
        const Icon = categories.find(c => c.kind === kind)?.icon ?? FileText;
        return <article className={s.file} key={file.id}><div className={`${s.fileIcon} ${s[kind as 'pdf' | 'image' | 'video' | 'audio']}`}><Icon aria-hidden="true" /></div><div className={s.fileText}><strong>{file.name}</strong><small>{formatSize(file.size)} · {formatFileDate(file.created_at)}</small></div><Button disabled variant="ghost" className={s.fileMenu} aria-label={`Actions unavailable for ${file.name}`} title="File actions await My Files review"><MoreVertical aria-hidden="true" /></Button></article>;
      })}</div> : <div className={s.message}><CloudUpload aria-hidden="true" /><h2>No files yet</h2>{destination('upload', 'Upload a file', s.secondary, <>Upload a file</>)}</div>}
      {signedIn && known && <Button onClick={refresh} disabled={loading} variant="ghost" className={s.textLink}>Refresh</Button>}
    </section>
  </>;
}