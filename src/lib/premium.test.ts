import { describe, it, expect } from "vitest";
import { PREMIUM_PLANS, activePremium } from "./premium";

describe("premium plans", () => {
  it("Plus costs ₹149 per month", () => expect(PREMIUM_PLANS.plus.priceInr).toBe(149));
  it("Pro costs ₹399 per month", () => expect(PREMIUM_PLANS.pro.priceInr).toBe(399));
  it("expired premium is not active", () =>
    expect(activePremium({ premium_tier: "pro", premium_until: "2000-01-01T00:00:00Z" })).toBeNull());
  it("future premium is active", () =>
    expect(activePremium({ premium_tier: "plus", premium_until: "2999-01-01T00:00:00Z" })).toBe("plus"));
});
