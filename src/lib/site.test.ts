import { describe, expect, it } from 'vitest';
import { site } from './site';
describe('Tanyora public destinations', () => {
  it('targets the owner supplied Android package, not the reference app', () => {
    const url = new URL(site.playStoreUrl);
    expect(url.origin).toBe('https://play.google.com');
    expect(url.searchParams.get('id')).toBe('com.tanyora.twa');
  });
});
