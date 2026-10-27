import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSharedFile } from "./shared-file";

const backend = vi.hoisted(() => ({ from: vi.fn(), single: vi.fn(), sign: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: backend.from,
  storage: { from: () => ({ createSignedUrl: backend.sign }) },
} }));
const file = { owner_id: "free-owner", name: "My photo.jpg", file_type: "image", storage_path: "free-owner/photo.jpg", expires_at: null, source: "original" };
beforeEach(() => {
  vi.clearAllMocks();
  backend.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: backend.single }) }) });
  backend.sign.mockResolvedValue({ data: { signedUrl: "https://example.com/guarded-photo" } });
});
describe("installed app owner viewing", () => {
  it.each(["image", "video", "audio", "pdf", "other"])("opens an owner's %s without any premium profile lookup", async (file_type) => {
    backend.single.mockResolvedValue({ data: { ...file, file_type } });
    expect(await loadSharedFile("my-upload")).toMatchObject({ owner_id: "free-owner", file_type, url: "https://example.com/guarded-photo" });
    expect(backend.from.mock.calls).toEqual([["files"]]);
    expect(backend.sign).toHaveBeenCalledWith("free-owner/photo.jpg", 10800);
  });
  it("keeps an expired owner's share blocked", async () => {
    backend.single.mockResolvedValue({ data: { ...file, expires_at: "2000-01-01T00:00:00Z" } });
    expect(await loadSharedFile("expired")).toEqual({ expired: true });
    expect(backend.sign).not.toHaveBeenCalled();
  });
  it("never substitutes an external URL when guarded signing is denied", async () => {
    backend.single.mockResolvedValue({ data: { ...file, external_url: "https://example.com/unguarded" } });
    backend.sign.mockResolvedValue({ data: null, error: { message: "Blocked" } });
    expect(await loadSharedFile("blocked")).toBeNull();
  });
  it("rejects metadata errors even if a row is present", async () => {
    backend.single.mockResolvedValue({ data: file, error: { message: "Denied" } });
    expect(await loadSharedFile("denied")).toBeNull();
    expect(backend.sign).not.toHaveBeenCalled();
  });
  it("rejects malformed expiry without signing", async () => {
    backend.single.mockResolvedValue({ data: { ...file, expires_at: "invalid" } });
    expect(await loadSharedFile("invalid-expiry")).toBeNull();
    expect(backend.sign).not.toHaveBeenCalled();
  });
  it("blocks expiry at the exact current instant", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-27T08:00:00Z"));
    try {
      backend.single.mockResolvedValue({ data: { ...file, expires_at: "2026-10-27T08:00:00Z" } });
      expect(await loadSharedFile("exact-expiry")).toEqual({ expired: true });
      expect(backend.sign).not.toHaveBeenCalled();
    } finally { clock.mockRestore(); }
  });
  it.each([null, {}, { signedUrl: "" }, { signedUrl: "javascript:alert(1)" }, { signedUrl: "invalid-url" }])("rejects absent or unsafe signing data %j", async data => {
    backend.single.mockResolvedValue({ data: file });
    backend.sign.mockResolvedValue({ data });
    expect(await loadSharedFile("bad-signing")).toBeNull();
  });
  it("never opens an external-only row instead of guarded storage", async () => {
    backend.single.mockResolvedValue({ data: { ...file, storage_path: null, external_url: "https://example.com/external" } });
    expect(await loadSharedFile("external")).toBeNull();
    expect(backend.sign).not.toHaveBeenCalled();
  });
  it.each(["metadata", "signing"])("fails closed on a thrown %s error", async operation => {
    backend.single.mockResolvedValue({ data: file });
    (operation === "metadata" ? backend.single : backend.sign).mockRejectedValue(new Error("Network failed"));
    expect(await loadSharedFile("network-failure")).toBeNull();
  });
});