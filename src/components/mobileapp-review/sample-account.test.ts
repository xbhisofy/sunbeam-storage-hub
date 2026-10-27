import { describe, expect, it } from 'vitest';
import { displayedReviewAccount, sampleAccount } from './sample-account';

describe('isolated sample account', () => {
  it('shows sample data without an authenticated user', () => {
    expect(displayedReviewAccount(null, undefined)).toBe(sampleAccount);
    expect(sampleAccount.profile.email).toBe('alex@example.com');
  });
  it('never substitutes sample data for an authenticated account', () => {
    expect(displayedReviewAccount('real-user', undefined)).toBeUndefined();
    const account = { profile: { ...sampleAccount.profile, email: 'real@example.com' }, files: [] };
    expect(displayedReviewAccount('real-user', account)).toBe(account);
  });
});