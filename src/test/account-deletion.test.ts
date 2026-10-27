import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(), range: vi.fn(), remove: vi.fn(), deleteFiles: vi.fn(), deleteUser: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ middleware: () => ({ handler: (fn: unknown) => fn }) }),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ eq: mocks.list }),
      delete: () => ({ eq: mocks.deleteFiles }),
    }),
    storage: { from: () => ({ remove: mocks.remove }) },
    auth: { admin: { deleteUser: mocks.deleteUser } },
  },
}));
import { deleteMyAccount } from "@/lib/account.functions";

// The mock exposes the real handler while skipping the HTTP transport.
const run = deleteMyAccount as unknown as (input: { context: { userId: string } }) => Promise<{ ok: boolean }>;
describe("Account deletion safeguards", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.list.mockReturnValue({ order: () => ({ range: mocks.range }) });
    mocks.range.mockResolvedValue({ data: [{ source: "original", storage_path: "owner/video.mp4" }], error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.deleteFiles.mockResolvedValue({ error: null });
    mocks.deleteUser.mockResolvedValue({ error: null });
  });
  it("does not delete the account when uploaded file removal fails", async () => {
    mocks.remove.mockResolvedValue({ error: { message: "storage failure" } });
    await expect(run({ context: { userId: "owner" } })).rejects.toThrow("Unable to delete uploaded files");
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.deleteFiles).not.toHaveBeenCalled();
  });
  it("does not delete the account when owned record removal fails", async () => {
    mocks.deleteFiles.mockResolvedValue({ error: { message: "record failure" } });
    await expect(run({ context: { userId: "owner" } })).rejects.toThrow("Unable to delete file records");
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("deletes only the authenticated user's account after removing their files", async () => {
    await expect(run({ context: { userId: "owner" } })).resolves.toEqual({ ok: true });
    expect(mocks.list).toHaveBeenCalledWith("owner_id", "owner");
    expect(mocks.remove).toHaveBeenCalledWith(["owner/video.mp4"]);
    expect(mocks.deleteFiles).toHaveBeenCalledWith("owner_id", "owner");
    expect(mocks.deleteUser).toHaveBeenCalledWith("owner");
  });
  it("never removes converted or another uploader's objects, even with misleading metadata", async () => {
    mocks.range.mockResolvedValue({ data: [
      { source: "original", storage_path: "owner/own.jpg" },
      { source: "converted", storage_path: "uploader/original.jpg" },
      { source: "converted", storage_path: "owner/alias.jpg" },
      { source: "original", storage_path: "uploader/not-owned.jpg" },
      { source: "original", storage_path: "owner/../uploader/traversal.jpg" },
      { source: "original", storage_path: "owner/%2e%2e/encoded.jpg" },
      { source: "original", storage_path: null },
    ], error: null });
    await run({ context: { userId: "owner" } });
    expect(mocks.remove.mock.calls).toEqual([[["owner/own.jpg"]]]);
    expect(mocks.deleteFiles).toHaveBeenCalledWith("owner_id", "owner");
  });
  it("enumerates later pages and deduplicates objects before deleting records", async () => {
    const fullPage = Array.from({ length: 1000 }, () => ({ source: "original", storage_path: "owner/duplicate.jpg" }));
    mocks.range.mockResolvedValueOnce({ data: fullPage, error: null })
      .mockResolvedValueOnce({ data: [{ source: "original", storage_path: "owner/last.jpg" }, fullPage[0]], error: null });
    await run({ context: { userId: "owner" } });
    expect(mocks.range.mock.calls).toEqual([[0, 999], [1000, 1999]]);
    expect(mocks.remove).toHaveBeenCalledWith(["owner/duplicate.jpg", "owner/last.jpg"]);
    expect(mocks.deleteFiles.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.range.mock.invocationCallOrder[1]);
  });
  it("stops before all mutations when a later list page fails", async () => {
    mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, () => ({ source: "original", storage_path: "owner/file.jpg" })), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "list failed" } });
    await expect(run({ context: { userId: "owner" } })).rejects.toThrow("Unable to list account files");
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.deleteFiles).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("removes 101 unique owned objects in bounded batches", async () => {
    mocks.range.mockResolvedValue({ data: Array.from({ length: 101 }, (_, i) => ({ source: "original", storage_path: `owner/${i}.jpg` })), error: null });
    await run({ context: { userId: "owner" } });
    expect(mocks.remove.mock.calls.map(([paths]) => paths.length)).toEqual([100, 1]);
    expect(mocks.remove.mock.calls[1][0]).toEqual(["owner/100.jpg"]);
  });
});