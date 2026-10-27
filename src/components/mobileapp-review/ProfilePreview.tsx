import { ReviewNotice } from './ReviewNotice';
import { Link } from '@tanstack/react-router';
import { Crown, HardDrive, Folder, Link2, UserRound, Headphones, Lock, FileText, ShieldCheck, Copyright, CircleHelp, ChevronRight, LogOut, Trash2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewAccount } from './sample-account';
import { reviewPlan } from './plan-display';
import p from './ProfilePreview.module.css';

export function ProfilePreview({ account, signedIn }: { account: ReviewAccount | null | undefined; signedIn: boolean }) {
  const plan = reviewPlan(account?.profile ?? null);
  const files = account?.files ?? [];
  const name = account?.profile.display_name || 'Your account';
  const editPath = signedIn ? '/profile' : '/auth';
  const settings = [
    { to: editPath, icon: UserRound, label: 'Edit profile', detail: 'Change your name or email' },
    { to: '/contact', icon: Headphones, label: 'Contact support', detail: 'Get help from our support team' },
    { to: '/privacy', icon: Lock, label: 'Privacy Policy', detail: 'Learn how we protect your data' },
    { to: '/terms', icon: FileText, label: 'Terms of Service', detail: 'Read our terms and conditions' },
    { to: '/community-guidelines', icon: ShieldCheck, label: 'Community Guidelines', detail: 'Rules for a safe and healthy community' },
    { to: '/copyright', icon: Copyright, label: 'Copyright & DMCA', detail: 'Report copyright issues' },
    { to: '/faq', icon: CircleHelp, label: 'Help & FAQ', detail: 'Find answers to common questions' },
  ] as const;
  const stats = [
    { icon: Crown, value: `${plan.name} Plan`, label: 'Current Plan', tone: '' },
    { icon: HardDrive, value: `${(plan.storage / 1024 ** 3).toFixed(1)} GB`, label: 'Total Storage', tone: p.storage },
    { icon: Folder, value: `${files.length} Files`, label: 'Your Files', tone: p.files },
    { icon: Link2, value: `${files.filter(f => !!f.slug).length} Links`, label: 'Shared Links', tone: p.links },
  ];
  return <div className={p.profile}>
    <header className={p.heading}><h1>Tanyora</h1><p>Cloud for Everyone</p></header>
    <section className={p.account} aria-label="Account details">
      <div className={p.avatar}>{name.charAt(0).toUpperCase()}<Button asChild variant="ghost" className={p.edit}><Link to={editPath} aria-label="Edit account details"><Camera aria-hidden="true" /></Link></Button></div>
      <div className={p.identity}><span className={p.badge}><Crown aria-hidden="true" />{plan.name} Plan</span><h2>{name}</h2><p>{account?.profile.email || 'Account email unavailable'}</p></div>
    </section>
    <div className={p.summary} aria-label="Account summary">{stats.map(({ icon: Icon, value, label, tone }) => <div className={p.tile} key={label}><span className={`${p.tileIcon} ${tone}`}><Icon aria-hidden="true" /></span><strong>{value}</strong><small>{label}</small></div>)}</div>
    <section className={p.settings} aria-label="Profile settings">{settings.map(({ to, icon: Icon, label, detail }) => <Button asChild variant="ghost" className={p.row} key={label}><Link to={to}><span className={p.rowIcon}><Icon aria-hidden="true" /></span><span className={p.rowText}><strong>{label}</strong><small>{detail}</small></span><ChevronRight aria-hidden="true" /></Link></Button>)}</section>
    <div className={p.actions}><ReviewNotice title="Log out" description={signedIn ? 'Manage your signed-in session from your account page.' : 'This sample profile is not a signed-in account.'} accountAction={!signedIn}><Button variant="outline" className={p.logout}><LogOut aria-hidden="true" />Log out</Button></ReviewNotice><ReviewNotice title="Delete account" description={signedIn ? 'Open account settings to confirm permanent account deletion. No files are deleted from this preview.' : 'Sample profiles cannot be deleted. Sign in to manage your own account.'} accountAction={!signedIn}><Button variant="outline" className={p.delete}><Trash2 aria-hidden="true" />Delete account</Button></ReviewNotice></div>
  </div>;
}
