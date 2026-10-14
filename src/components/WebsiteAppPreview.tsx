import { FileText, Image, Video, Music, Menu, MoreVertical, Home, FolderOpen, Share2, User, Plus, Play, ShieldCheck } from 'lucide-react';
import logo from '@/assets/tanyora-logo.jpg';

export function WebsiteAppPreview({ screen = 'home' }: { screen?: 'home' | 'files' | 'share' | 'profile' }) {
  const names = { home: 'Tanyora', files: 'My Files', share: 'Shared', profile: 'Profile' };
  return <div className="website-phone" aria-label={`Illustrative Tanyora ${names[screen]} preview`}>
    <div className="phone-status"><span>9:41</span><span>••• ▰</span></div>
    <div className="phone-header"><Menu size={18} /><strong>{names[screen]}</strong><img src={logo} width={24} height={24} alt="" /></div>
    <div className="phone-body">
      {screen === 'home' && <><h3>All your files.<br />One place.</h3><div className="phone-storage"><span>Storage used</span><strong>24.8 MB <small>/ 1 GB</small></strong><div className="phone-progress" /></div><div className="phone-categories">{[FileText, Image, Video, Music].map((Icon, i) => <div key={i}><Icon size={20} /><span>{['Docs', 'Images', 'Videos', 'Music'][i]}</span></div>)}</div><h4>Recent files</h4></>}
      {screen === 'profile' ? <><div className="phone-profile"><div className="phone-avatar">A</div><strong>Alex Morgan</strong><span>alex@example.com</span><div><span>Free Plan</span><b>Upgrade</b></div></div>{['Storage', 'Shared files', 'Help & support', 'Privacy Policy', 'About Tanyora'].map(t => <div className="phone-setting" key={t}><ShieldCheck size={16} /><span>{t}</span><span>›</span></div>)}</> : <>{screen === 'share' && <div className="phone-video"><Play size={36} /><span>Custom video playback</span></div>}{[{name:'Weekend highlights.mp4',icon:Video,type:'video'}, {name:'Travel photos.png',icon:Image,type:'image'}, {name:'Project notes.pdf',icon:FileText,type:'document'}, {name:'Acoustic session.mp3',icon:Music,type:'audio'}].slice(0,screen==='home'?3:4).map(f => <div className="phone-file" key={f.name}><span className={`category-${f.type}`}><f.icon size={19}/></span><div><strong>{f.name}</strong><small>4.2 MB · 14 Oct 2026</small></div><MoreVertical size={16}/></div>)}{screen === 'files' && <div className="phone-upload"><Plus size={22}/><span>Your library, organised</span></div>}{screen==='share' && <div className="phone-link"><Share2 size={18}/><strong>Share on your terms</strong><span>1 hour · 24 hours · 7 days · Never</span></div>}</>}
    </div>
    <div className="phone-nav">{[Home, FolderOpen, Plus, Share2, User].map((Icon,i)=><span key={i} className={i===2?'phone-plus':''}><Icon size={18}/>{i!==2&&<small>{['Home','Files','','Shared','Profile'][i]}</small>}</span>)}</div>
  </div>;
}