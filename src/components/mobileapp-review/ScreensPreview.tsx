import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { UserRound, Pencil, ChevronRight, ShieldCheck, FileText, Headphones, LogOut, Trash2, Search, CloudUpload, Image, Folder, Camera, HardDrive, Share2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSize, formatFileDate } from '@/lib/format';
import { reviewPlan } from './plan-display';
import type { ReviewFile, ReviewScreen } from './data';
import art from './assets/home-cloud.png';
import s from './mobileapp-review.module.css';

type Account = { profile: { display_name: string | null; email: string | null; premium_tier: string | null; premium_until: string | null }; files: ReviewFile[] };
export function ScreensPreview({ screen, account, loading, error, signedIn, refresh }: { screen: Exclude<ReviewScreen, 'home'>; account: Account | null | undefined; loading: boolean; error: boolean; signedIn: boolean; refresh: () => void }) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('recent');
  const files = account?.files ?? [];
  const plan = reviewPlan(account?.profile ?? null);
  const title = { files: 'My Files', upload: 'Upload', shared: 'Shared Links', profile: 'Profile' }[screen];
  const signIn = <div className={s.message}><UserRound aria-hidden="true" /><h2>Sign in to view your {screen === 'profile' ? 'account' : 'files'}</h2><Button asChild variant="outline" className={s.secondary}><Link to="/auth">Sign in</Link></Button></div>;
  const actions = <div className={s.message}>{!signedIn ? signIn : loading ? <p role="status">Loading…</p> : error ? <><p role="alert">Could not load your account.</p><Button variant="outline" className={s.secondary} onClick={refresh}>Try again</Button></> : null}</div>;
  if (screen === 'profile') return <>
    <header className={s.screenHeading}><h1>Profile</h1><ShieldCheck aria-hidden="true" /></header>
    <section className={s.accountPanel}><div className={s.profileAvatar}><UserRound aria-hidden="true" /></div><div className={s.profileInfo}><h2>{account?.profile.display_name || (signedIn ? 'Your account' : 'Welcome to Tanyora')}</h2><p>{account?.profile.email || 'Sign in to access your account'}</p><span className={s.plan}>{account ? `${plan.name} Plan` : '—'}</span></div></section>
    <div className={s.stats}>{[['Storage', account ? `${plan.storage / 1024 ** 3} GB` : '—'], ['Files', account ? String(files.length) : '—'], ['Links', account ? String(files.filter(f => !!f.slug).length) : '—']].map(([label,value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
    <section className={s.settings}>
      <Button asChild variant="ghost" className={s.setting}><Link to={signedIn ? '/profile' : '/auth'}><Pencil aria-hidden="true" />Edit Profile<ChevronRight aria-hidden="true" /></Link></Button>
      <Button asChild variant="ghost" className={s.setting}><Link to="/contact"><Headphones aria-hidden="true" />Help &amp; Support<ChevronRight aria-hidden="true" /></Link></Button>
      <Button asChild variant="ghost" className={s.setting}><Link to="/privacy"><ShieldCheck aria-hidden="true" />Privacy Policy<ChevronRight aria-hidden="true" /></Link></Button>
      <Button asChild variant="ghost" className={s.setting}><Link to="/terms"><FileText aria-hidden="true" />Terms of Service<ChevronRight aria-hidden="true" /></Link></Button>
      <Button asChild variant="ghost" className={s.setting}><Link to="/copyright"><FileText aria-hidden="true" />Copyright &amp; DMCA<ChevronRight aria-hidden="true" /></Link></Button>
    </section>
    <div className={s.accountActions}><Button disabled variant="outline" className={s.secondary} title="Read-only preview"><LogOut aria-hidden="true" />Log out</Button><Button disabled variant="ghost" className={s.danger} title="Read-only preview"><Trash2 aria-hidden="true" />Delete account</Button></div>
    {!signedIn && signIn}
  </>;
  if (screen === 'upload') return <>
    <header className={s.screenHeading}><h1>Upload</h1><CloudUpload aria-hidden="true" /></header>
    <section className={s.uploadIntro}><img src={art} alt="" width="150" height="150" /><h2>Upload to your cloud</h2><p>Keep your files safe and share them easily.</p></section>
    <div className={s.uploadChoices}>{[{ icon: Image, name: 'Photos & Videos', caption: 'Your favourite moments, safely stored' }, { icon: FileText, name: 'Documents & Files', caption: 'PDFs, documents and more' }].map(({ icon: Icon, name, caption }) => <Button asChild variant="ghost" className={s.uploadChoice} key={name}><Link to={signedIn ? '/content' : '/auth'}><span className={s.fileIcon}><Icon aria-hidden="true" /></span><span><strong>{name}</strong><small>{caption}</small></span><ChevronRight aria-hidden="true" /></Link></Button>)}</div>
    <div className={s.sources}><Button disabled variant="ghost" className={s.utility}><Camera aria-hidden="true" />Camera</Button><Button asChild variant="ghost" className={s.utility}><Link to={signedIn ? '/content' : '/auth'}><Folder aria-hidden="true" />Browse Files</Link></Button><Button disabled variant="ghost" className={s.utility}><HardDrive aria-hidden="true" />Drive</Button></div>
    <div className={s.message}><ShieldCheck aria-hidden="true" /><p>Your files remain private until you share them.</p></div>
  </>;
  const base = screen === 'shared' ? files.filter(f => !!f.slug) : files;
  const shown = base.filter(f => (kind === 'all' || f.file_type === kind) && f.name.toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'size' ? b.size-a.size : Date.parse(b.created_at)-Date.parse(a.created_at));
  return <>
    <header className={s.screenHeading}><h1>{title}</h1>{screen === 'shared' ? <Share2 aria-hidden="true" /> : <Folder aria-hidden="true" />}</header>
    <label className={s.searchBox}><Search aria-hidden="true" /><input aria-label={`Search ${title}`} placeholder={screen === 'shared' ? 'Search shared links' : 'Search your files'} value={search} onChange={e => setSearch(e.target.value)} /></label>
    <div className={s.filters}>{['all','image','video','pdf','audio'].map(k => <Button key={k} variant="ghost" className={`${s.chip} ${k === kind ? s.selectedChip : ''}`} aria-pressed={k===kind} onClick={() => setKind(k)}>{({ all: 'All', image: 'Images', video: 'Videos', pdf: 'Docs', audio: 'Music' } as Record<string,string>)[k]}<span>{account ? base.filter(f => k==='all' || f.file_type===k).length : '—'}</span></Button>)}</div>
    <div className={s.sortBar}><span>{account ? `${shown.length} ${screen==='shared' ? 'links' : 'files'}` : 'Your library'}</span><select aria-label="Sort files" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Recent</option><option value="name">Name</option><option value="size">Size</option><option value="date">Date</option></select></div>
    {(!signedIn || loading || error) ? actions : shown.length ? <div className={s.fileList}>{shown.map(f => <article key={f.id} className={s.file}><div className={`${s.fileIcon} ${s.image}`}><FileText aria-hidden="true" /></div><div className={s.fileText}><strong>{f.name}</strong><small>{formatSize(f.size)} · {formatFileDate(f.created_at)}</small>{screen === 'shared' && <small className={s.expiry}>{f.expires_at ? Date.parse(f.expires_at) <= Date.now() ? 'Link expired' : `Expires ${formatFileDate(f.expires_at)}` : 'Never expires'}</small>}</div><Button asChild variant="ghost" className={s.fileMenu}><Link to={screen === 'shared' ? '/shared' : '/content'} aria-label={`Manage ${f.name}`}><MoreVertical aria-hidden="true" /></Link></Button></article>)}</div> : <div className={s.message}><img src={art} alt="" width="112" height="112" /><h2>{search || kind !== 'all' ? 'No matching files' : screen === 'shared' ? 'No shared links yet' : 'No files yet'}</h2><Button asChild variant="outline" className={s.secondary}><Link to="/mobileapp" search={{ screen: 'upload' }}>{screen==='shared' ? 'Share a File' : 'Upload a file'}</Link></Button></div>}
  </>;
}