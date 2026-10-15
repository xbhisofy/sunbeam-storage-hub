import { describe, expect, it } from "vitest";
import { ACCOUNT_MENU, canOpenPayment, conversionProblem, parseShareSlug, pendingTotal } from "./feature-rules";

describe("native feature rules", () => {
  it("offers every requested account destination", () => {
    expect(ACCOUNT_MENU.map(item => item.path)).toEqual(["/", "/content", "/content", "/convert", "/earnings", "/wallet", "/oc-bonus", "/referrals", "/profile", "/plans"]);
  });
  it("allows website funds and upgrades for direct distribution", () => {
    expect(canOpenPayment("wallet", "direct")).toBe(true);
    expect(canOpenPayment("plans", "direct")).toBe(true);
  });
  it("does not steer Play builds to external digital purchases", () => {
    expect(canOpenPayment("wallet", "play")).toBe(false);
    expect(canOpenPayment("plans", "play")).toBe(false);
    expect(canOpenPayment("plans", "unknown")).toBe(false);
  });
  it("keeps withdrawals on the website for either distribution", () => {
    expect(canOpenPayment("earnings", "play")).toBe(true);
    expect(canOpenPayment("earnings", "direct")).toBe(true);
  });
  it("converts only valid HTTPS Tanyora share links", () => {
    expect(parseShareSlug("https://tanyora.com/s/abc_123", "https://tanyora.com", "https://app.tanyora.com")).toBe("abc_123");
    for (const url of ["https://fake.test/s/abc", "https://tanyora.com.fake.test/s/abc", "http://tanyora.com/s/abc", "https://tanyora.com/s/abc/other", "invalid"]) expect(parseShareSlug(url, "https://tanyora.com", "https://app.tanyora.com")).toBeNull();
  });
  it("rejects converting your own file", () => {
    expect(conversionProblem({ owner_id: "owner", expires_at: null }, "owner")).not.toBeNull();
    expect(conversionProblem({ owner_id: "owner", expires_at: null }, "other")).toBeNull();
  });
  it("rejects expired share links", () => {
    expect(conversionProblem({ owner_id: "owner", expires_at: "2026-10-14" }, "other", Date.parse("2026-10-15"))).not.toBeNull();
  });
  it("includes pending and approved payouts only in on-hold balance", () => {
    expect(pendingTotal([{ status: "pending", amount: "5" }, { status: "approved", amount: 7 }, { status: "paid", amount: 20 }, { status: "rejected", amount: 10 }])).toBe(12);
  });
});