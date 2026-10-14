import { describe, expect, it } from 'vitest';
import { PAYOUT_METHODS, PAYOUT_METHOD_VALUES, PAYOUT_METHODS_SENTENCE, payoutMethod } from './payouts';

// The backend function request_withdrawal rejects any method outside its own
// whitelist, so the list the app offers must stay exactly in step with it.
const BACKEND_ALLOWED = ['upi', 'paypal', 'bank', 'usdt'];

describe('payout methods', () => {
  it('offers exactly the methods the backend accepts', () => {
    expect([...PAYOUT_METHOD_VALUES].sort()).toEqual([...BACKEND_ALLOWED].sort());
  });

  it('includes USDT crypto with a TRC-20 wallet field', () => {
    const usdt = payoutMethod('usdt');
    expect(usdt?.label).toBe('USDT');
    expect(usdt?.detailsLabel).toBe('USDT wallet address');
    expect(usdt?.placeholder).toContain('TRC-20');
  });

  it('names every method in the help sentence', () => {
    for (const m of PAYOUT_METHODS) expect(PAYOUT_METHODS_SENTENCE).toContain(m.label);
    expect(PAYOUT_METHODS_SENTENCE).toMatch(/ and /);
  });
});
