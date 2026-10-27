import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Home, Folder, Share2, UserRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/site';
import { HomePreview } from '@/components/mobileapp-review/HomePreview';
import { ScreensPreview } from '@/components/mobileapp-review/ScreensPreview';
import { sessionOptions, accountOptions, reviewSearch } from '@/components/mobileapp-review/data';
import { displayedReviewAccount } from '@/components/mobileapp-review/sample-account';
import s from '@/components/mobileapp-review/mobileapp-review.module.css';

// Temporary review route: no writes, native imports, website shell changes or publishing.
export const Route = createFileRoute('/mobileapp')({
  ssr: false,
  validateSearch: reviewSearch,
  head: () => pageHead('Tanyora Mobile Preview', 'Tanyora cloud storage interface preview: Home, My Files, Upload, Shared Links and Profile.', undefined, true),
  loader: async ({ context }) => {
    const uid = await context.queryClient.ensureQueryData(sessionOptions);
    if (uid) await context.queryClient.prefetchQuery(accountOptions(uid));
  },
  pendingComponent: () => <div className={s.review}><div className={s.phone} role="status">Loading Tanyora…</div></div>,
  component: MobileAppReview,
});

function MobileAppReview() {
  const { screen, kind } = Route.useSearch();
  const { data: uid } = useSuspenseQuery(sessionOptions);
  const account = useQuery({ ...accountOptions(uid), enabled: !!uid });
  const displayAccount = displayedReviewAccount(uid, account.data);
  const sample = !uid;
  const nav = [
    { screen: 'home' as const, label: 'Home', icon: Home },
    { screen: 'files' as const, label: 'Files', icon: Folder },
    { screen: 'shared' as const, label: 'Shared', icon: Share2 },
    { screen: 'profile' as const, label: 'Profile', icon: UserRound },
  ];
  const item = (entry: typeof nav[number]) => <Button key={entry.screen} asChild variant="ghost" className={`${s.navItem} ${screen === entry.screen ? s.active : ''}`}><Link to="/mobileapp" search={{ screen: entry.screen }} aria-current={screen === entry.screen ? 'page' : undefined}><entry.icon aria-hidden="true" /><span>{entry.label}</span></Link></Button>;
  return <div className={s.review}>
    <main key={screen} className={s.phone}>
      {sample && <span className="sr-only">Sample account</span>}
      {screen === 'home' ? <HomePreview account={displayAccount} signedIn={!!uid} loading={!sample && account.isFetching} error={!sample && account.isError} refresh={() => { if (uid) void account.refetch(); }} /> : <ScreensPreview key={`${screen}-${kind ?? 'all'}`} initialKind={kind} screen={screen} account={displayAccount} signedIn={!!uid} loading={!sample && account.isFetching} error={!sample && account.isError} refresh={() => { if (uid) void account.refetch(); }} />}
    </main>
    <div className={`${s.navWrap} ${screen === 'shared' || screen === 'profile' ? s.square : ''}`}><nav className={s.nav} aria-label="App navigation">{nav.slice(0, 2).map(item)}<Button asChild variant="ghost" className={s.uploadNav}><Link to="/mobileapp" search={{ screen: 'upload' }} aria-label="Upload a file" aria-current={screen === 'upload' ? 'page' : undefined}><span className={s.halo}><span className={s.diamond}><Plus aria-hidden="true" /></span></span></Link></Button>{nav.slice(2).map(item)}</nav></div>
  </div>;
}