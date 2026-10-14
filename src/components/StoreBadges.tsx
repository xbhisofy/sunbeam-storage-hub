import badge from '@/assets/google-play.png.asset.json';
import { site } from '@/lib/site';

export function StoreBadges() {
  return <div className="store-badges">
    <a href={site.playStoreUrl} target="_blank" rel="noopener noreferrer" aria-label="Get Tanyora on Google Play"><img src={`https://tanyora.lovable.app${badge.url}`} alt="Get it on Google Play" width={646} height={250} /></a>
    <span className="apple-badge" aria-label="App Store coming soon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.2 12.7c0-2 1.6-3 1.7-3.1-1-1.4-2.6-1.6-3.1-1.6-1.3-.1-2.5.8-3.2.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 2-1.1 2.7-2.2.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.4-.9-2.4-3.9ZM15.2 6.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3Z" /></svg><span><small>COMING SOON</small><strong>App Store</strong></span></span>
  </div>;
}