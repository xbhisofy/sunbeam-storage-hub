import { describe, expect, it } from 'vitest';
import { reviewSearch } from './data';

describe('temporary review navigation', () => {
  it('accepts all five approved destinations', () => {
    for (const screen of ['home', 'files', 'upload', 'shared', 'profile']) {
      expect(reviewSearch({ screen }).screen).toBe(screen);
    }
  });
  it('falls back to Home for an external or unknown destination', () => {
    expect(reviewSearch({ screen: 'https://example.com' }).screen).toBe('home');
    expect(reviewSearch({ screen: 'wallet' }).screen).toBe('home');
  });
});