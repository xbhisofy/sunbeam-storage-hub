import { beforeEach, describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), select: vi.fn(), order: vi.fn(), range: vi.fn() }));
vi.mock("../node_modules/expo-file-system/legacy.ts", () => ({}));
vi.mock("../node_modules/expo-file-system/lib/legacy/index.js", () => ({}));
vi.mock("./supabase", () => ({ supabase: { from: api.from } }));
import { myFiles } from "./files";

describe("Native complete file reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = { select: api.select, eq: api.eq, order: api.order, range: api.range };
    api.from.mockReturnValue(query); api.select.mockReturnValue(query); api.eq.mockReturnValue(query); api.order.mockReturnValue(query);
  });
  it("deduplicates simultaneous tabs and reads every backend page", async () => {
    api.range.mockResolvedValueOnce({ data: Array.from({ length: 200 }, (_, id) => ({ id: String(id) })), error: null }).mockResolvedValueOnce({ data: [{ id: "last" }], error: null });
    const first = myFiles("owner");
    expect(myFiles("owner")).toBe(first);
    expect(await first).toHaveLength(201);
    expect(api.range.mock.calls).toEqual([[0, 199], [200, 399]]);
    expect(api.select).toHaveBeenCalledWith("id,name,file_type,mime,size,storage_path,slug,created_at,expires_at,source");
    expect(api.order).toHaveBeenCalledWith("id", { ascending: false });
  });
  it("fails a partial read and lets the next refresh retry", async () => {
    api.range.mockResolvedValueOnce({ data: null, error: new Error("offline") }).mockResolvedValueOnce({ data: [], error: null });
    await expect(myFiles("retry-owner")).rejects.toThrow("offline");
    expect(await myFiles("retry-owner")).toEqual([]);
  });
});