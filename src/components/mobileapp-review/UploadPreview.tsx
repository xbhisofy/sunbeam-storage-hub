import { Link } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2, Image, FileText, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import art from './assets/upload-cloud.png';
import s from './ReferenceScreens.module.css';
export function UploadPreview({ signedIn }: { signedIn: boolean }) {
  const destination = signedIn ? '/content' : '/auth';
  return <>
    <header className={s.uploadHeader}><Button asChild variant="ghost" className={s.back}><Link to="/mobileapp" search={{ screen: 'home' }} aria-label="Back to Home"><ArrowLeft aria-hidden="true" /></Link></Button><div><h1>Upload</h1><p>Choose what you want to upload</p></div></header>
    <section className={s.uploadHero}><div><small>UPLOAD TO TANYORA</small><h2>Add to your<br /><span>cloud storage</span></h2><p>Your files are safe, accessible everywhere and also available on the website.</p></div><img src={art} alt="Cloud upload" width="188" height="188" /></section>
    <div className={s.reassurance}>{['Secure Upload','Access Anywhere','Sync to Website'].map(text => <span key={text}><CheckCircle2 aria-hidden="true" />{text}</span>)}</div>
    <div className={s.uploadCards}>{[{ title: 'Photos & Videos', subtitle: 'Choose from your gallery', icon: Image, formats: ['JPG','PNG','MP4','MOV','HEIC'] }, { title: 'Documents & Files', subtitle: 'PDF, music and other files', icon: FileText, formats: ['PDF','DOC','XLS','MP3','ZIP'] }].map(({ title, subtitle, icon: Icon, formats }) => <Button asChild variant="ghost" className={s.uploadCard} key={title}><Link to={destination} search={signedIn ? { upload: title === 'Photos & Videos' ? 'image' : 'document' } : {}}><span className={s.uploadIcon}><Icon aria-hidden="true" /></span><span><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight aria-hidden="true" /><span className={s.formats}>{formats.map(format => <span key={format}><Icon aria-hidden="true" />{format}</span>)}</span></Link></Button>)}</div>
    <div className={s.adSlot}><span className={s.adBadge}>Ad</span><span>Advertisement</span></div>
    <div className={s.privacy}><ShieldCheck aria-hidden="true" /><p>Only the files you choose are uploaded.<br />They appear on the website too.</p></div>
  </>;
}