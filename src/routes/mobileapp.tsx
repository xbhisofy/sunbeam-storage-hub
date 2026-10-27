import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Home, Folder, Share2, UserRound, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/site';
import { HomePreview } from '@/components/mobileapp-review/HomePreview';
import { sessionOptions, accountOptions, reviewSearch, type ReviewScreen } from '@/components/mobileapp-review/data';
import s from '@/components/mobileapp-review/mobileapp-review.module.css';

// Temporary review route: no writes, native imports, website shell changes or publishing.
export const Route = createFileRoute('/mobileapp')({
  ssr: false,
  validateSearch: reviewSearch,
  head: () => pageHead('Android Home UI Review', 'Temporary Tanyora Android interface review with existing account data.', undefined, true),
  loader: async ({ context }) => {
    const uid = await context.queryClient.ensureQueryData(sessionOptions);
    if (uid) await context.queryClient.ensureQueryData(accountOptions(uid));
  },
  pendingComponent: () => <div className={s.review}><div className={s.phone} role="status">Loading Tanyora…</div></div>,
  component: MobileAppReview,
});

function MobileAppReview() {
  const { screen } = Route.useSearch();
  const { data: uid } = useSuspenseQuery(sessionOptions);
  const account = useQuery({ ...accountOptions(uid), enabled: !!uid });
  const titles: Record<ReviewScreen, string> = { home: 'Home', files: 'My Files', upload: 'Upload', shared: 'Shared Links', profile: 'Profile' };
  const nav = [
    { screen: 'home' as const, label: 'Home', icon: Home },
    { screen: 'files' as const, label: 'Files', icon: Folder },
    { screen: 'shared' as const, label: 'Shared', icon: Share2 },
    { screen: 'profile' as const, label: 'Profile', icon: UserRound },
  ];
  const item = (entry: typeof nav[number]) => <Button key={entry.screen} asChild variant="ghost" className={`${s.navItem} ${screen === entry.screen ? s.active : ''}`}><Link to="/mobileapp" search={{ screen: entry.screen }} aria-current={screen === entry.screen ? 'page' : undefined}><entry.icon aria-hidden="true" /><span>{entry.label}</span></Link></Button>;
  return <div className={s.review}>
    <main className={s.phone}>
      {screen === 'home' ? <HomePreview account={account.data} signedIn={!!uid} loading={account.isFetching} error={account.isError} refresh={() => { void account.refetch(); }} /> : <section className={`${s.message} ${s.pending}`} key={screen}><Clock aria-hidden="true" /><h1>{titles[screen]}</h1><p>Awaiting screen review approval.</p><Button asChild variant="outline" className={s.secondary}><Link to="/mobileapp" search={{ screen: 'home' }}>Back to Home</Link></Button></section>}
    </main>
    <div className={s.navWrap}><nav className={s.nav} aria-label="App navigation">{nav.slice(0, 2).map(item)}<Button asChild variant="ghost" className={s.uploadNav}><Link to="/mobileapp" search={{ screen: 'upload' }} aria-label="Upload a file" aria-current={screen === 'upload' ? 'page' : undefined}><span className={s.halo}><span className={s.diamond}><Plus aria-hidden="true" /></span></span></Link></Button>{nav.slice(2).map(item)}</nav></div>
  </div>;
}