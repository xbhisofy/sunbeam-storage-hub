import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("./supabase", () => ({ supabase: api }));
vi.mock("react-native", () => ({ AppState: {} }));
vi.mock("expo-router", () => ({ useFocusEffect: vi.fn() }));
vi.mock("../app/_layout", () => ({ useSession: vi.fn() }));
vi.mock("./config", () => ({ SHARE_URL: "https://tanyora.com", WEB_URL: "https://app.tanyora.com" }));

import { convertLink, loadEarnings } from "./account-data";

function query(data: unknown, error: { message: string } | null = null) {
  const result = { data, error };
  const builder = {
    select: vi.fn(), eq: vi.fn(), gte: vi.fn(), order: vi.fn(), limit: vi.fn(), insert: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result), single: vi.fn().mockResolvedValue(result),
    then: Promise.resolve(result).then.bind(Promise.resolve(result)),
  };
  for (const method of [builder.select, builder.eq, builder.gte, builder.order, builder.limit, builder.insert]) method.mockReturnValue(builder);
  return builder;
}

const original = { id: "original-file", owner_id: "original-owner", name: "Trip.mp4", file_type: "video", mime: "video/mp4", size: 2048, storage_path: "original-owner/trip.mp4", external_url: null, expires_at: null };

beforeEach(() => vi.clearAllMocks());

describe("native conversion data", () => {
  it("preserves original content and bonus attribution under the new owner's link", async () => {
    const source = query(original);
    const duplicate = query([]);
    const created = query({ id: "converted-file", slug: "new-link" });
    api.from.mockReturnValueOnce(source).mockReturnValueOnce(duplicate).mockReturnValueOnce(created);
    await expect(convertLink("new-owner", "https://tanyora.com/s/original-link")).resolves.toEqual({ id: "converted-file", slug: "new-link" });
    expect(created.insert).toHaveBeenCalledWith({ owner_id: "new-owner", name: "Trip.mp4", file_type: "video", mime: "video/mp4", size: 2048, storage_path: "original-owner/trip.mp4", external_url: null, source: "converted", parent_file_id: "original-file", expires_at: null });
    expect(duplicate.eq).toHaveBeenCalledWith("storage_path", "original-owner/trip.mp4");
  });
  it("never creates another conversion of already converted storage", async () => {
    api.from.mockReturnValueOnce(query(original)).mockReturnValueOnce(query([{ id: "existing" }]));
    await expect(convertLink("new-owner", "https://tanyora.com/s/original-link")).rejects.toThrow("already converted");
    expect(api.from).toHaveBeenCalledTimes(2);
  });
  it("does not write a conversion for your own original", async () => {
    api.from.mockReturnValueOnce(query(original));
    await expect(convertLink("original-owner", "https://tanyora.com/s/original-link")).rejects.toThrow("own file");
    expect(api.from).toHaveBeenCalledTimes(1);
  });
  it("does not query non-Tanyora links", async () => {
    await expect(convertLink("new-owner", "https://fake.test/s/original-link")).rejects.toThrow("valid Tanyora");
    expect(api.from).not.toHaveBeenCalled();
  });
});

describe("native account reads", () => {
  it("scopes balances, payouts and views to the current account", async () => {
    const profile = query({ balance: 12, paid_total: 5, referral_earnings: 2 });
    const payouts = query([{ id: "payout", status: "pending", amount: 5 }]);
    const views = query([{ day: "2026-10-15", views: 100 }]);
    api.from.mockReturnValueOnce(profile).mockReturnValueOnce(payouts).mockReturnValueOnce(views);
    const data = await loadEarnings("viewer");
    expect(profile.eq).toHaveBeenCalledWith("id", "viewer");
    expect(payouts.eq).toHaveBeenCalledWith("user_id", "viewer");
    expect(views.eq).toHaveBeenCalledWith("owner_id", "viewer");
    expect(data.profile.balance).toBe(12);
    expect(data.withdrawals[0].amount).toBe(5);
    expect(data.views[0].views).toBe(100);
  });
  it("reports data errors instead of displaying a false zero balance", async () => {
    api.from.mockReturnValueOnce(query(null, { message: "Unavailable" })).mockReturnValueOnce(query([])).mockReturnValueOnce(query([]));
    await expect(loadEarnings("viewer")).rejects.toThrow("Unavailable");
  });
});