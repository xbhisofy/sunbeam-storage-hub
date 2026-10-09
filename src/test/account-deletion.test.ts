import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(), remove: vi.fn(), deleteFiles: vi.fn(), deleteUser: vi.fn(),
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
    mocks.list.mockResolvedValue({ data: [{ storage_path: "owner/video.mp4" }], error: null });
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
});