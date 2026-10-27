import { expect, it } from 'vitest';
import { reviewPlan } from './plan-display';

it('keeps Free storage at 1 GiB', () => {
  expect(reviewPlan(null)).toEqual({ name: 'Free', storage: 1024 ** 3 });
});
it('keeps active Plus storage at 100 GiB', () => {
  expect(reviewPlan({ premium_tier: 'plus', premium_until: '2999-01-01T00:00:00Z' }))
    .toEqual({ name: 'Plus', storage: 100 * 1024 ** 3 });
});
it('keeps active Pro storage at 1 TiB', () => {
  expect(reviewPlan({ premium_tier: 'pro', premium_until: '2999-01-01T00:00:00Z' }))
    .toEqual({ name: 'Pro', storage: 1024 ** 4 });
});
it('keeps expired subscriptions on Free', () => {
  expect(reviewPlan({ premium_tier: 'pro', premium_until: '2000-01-01T00:00:00Z' }))
    .toEqual({ name: 'Free', storage: 1024 ** 3 });
});