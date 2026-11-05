import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), abort: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: api.from } }));
import { loadOwnedFiles, ownedFilesOptions } from "./owned-files";

describe("Website owned file reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = { select: vi.fn().mockReturnThis(), eq: api.eq, order: api.order, range: api.range, abortSignal: api.abort };
    api.from.mockReturnValue(query); api.eq.mockReturnValue(query); api.order.mockReturnValue(query);
    api.range.mockReturnValue(query); api.abort.mockResolvedValue({ data: [], error: null });
  });
  it("reads past backend response caps with stable sorting and cancellation", async () => {
    const page = Array.from({ length: 200 }, (_, id) => ({ id: String(id), size: 1 }));
    api.abort.mockResolvedValueOnce({ data: page, error: null }).mockResolvedValueOnce({ data: [{ id: "201", size: 7 }], error: null });
    const signal = new AbortController().signal;
    const files = await loadOwnedFiles("owner", signal);
    expect(files).toHaveLength(201);
    expect(files.reduce((total, f) => total + f.size, 0)).toBe(207);
    expect(api.range.mock.calls).toEqual([[0, 199], [200, 399]]);
    expect(api.eq).toHaveBeenCalledWith("owner_id", "owner");
    expect(api.order).toHaveBeenCalledWith("id", { ascending: false });
    expect(api.abort).toHaveBeenCalledWith(signal);
  });
  it("does not turn a failed later page into a successful partial library", async () => {
    api.abort.mockResolvedValueOnce({ data: Array.from({ length: 200 }, (_, id) => ({ id })), error: null }).mockResolvedValueOnce({ data: null, error: new Error("offline") });
    await expect(loadOwnedFiles("owner", new AbortController().signal)).rejects.toThrow("offline");
  });
  it("reuses a shared account cache across screens and keeps accounts separate", async () => {
    const qc = new QueryClient();
    await Promise.all([qc.fetchQuery(ownedFilesOptions("A")), qc.fetchQuery(ownedFilesOptions("A"))]);
    expect(api.from).toHaveBeenCalledTimes(1);
    await qc.fetchQuery(ownedFilesOptions("B"));
    expect(api.from).toHaveBeenCalledTimes(2);
    expect(ownedFilesOptions("A").queryKey).not.toEqual(ownedFilesOptions("B").queryKey);
    qc.clear();
  });
});