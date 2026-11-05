import { useEffect } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ uid: "A" as string | undefined, files: vi.fn(), single: vi.fn(), signed: vi.fn(), appChange: undefined as undefined | ((state: string) => void) }));
vi.mock("../app/_layout", () => ({ useSession: () => mocks.uid ? { user: { id: mocks.uid } } : null }));
vi.mock("./files", () => ({ myFiles: mocks.files }));
vi.mock("../node_modules/expo-router/build/index.js", () => ({ useFocusEffect: (callback: any) => useEffect(callback, [callback]) }));
vi.mock("../node_modules/react-native/index.js", () => ({ AppState: { addEventListener: (_: string, cb: any) => { mocks.appChange = cb; return { remove: vi.fn() }; } } }));
vi.mock("./supabase", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }),
  storage: { from: () => ({ createSignedUrl: mocks.signed }) },
} }));
import { useFiles } from "./useFiles";
import { useProfile } from "./useProfile";
import { useAvatarUrl } from "./avatar";
const deferred = <T,>() => { let resolve: (value: T) => void = () => {}; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; };

describe("Account-loading lifecycle", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.uid = "A"; mocks.files.mockResolvedValue([]); mocks.single.mockResolvedValue({ data: { display_name: "A" }, error: null }); });
  it("loads files only once on initial screen focus", async () => {
    const { result } = renderHook(() => useFiles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocks.files).toHaveBeenCalledTimes(1);
  });
  it("hides the old account immediately and rejects its late files", async () => {
    const old = deferred<any[]>();
    mocks.files.mockReturnValueOnce(old.promise).mockResolvedValueOnce([{ id: "B-file" }]);
    const { result, rerender } = renderHook(() => useFiles());
    mocks.uid = "B"; rerender();
    expect(result.current.files).toEqual([]);
    await waitFor(() => expect(result.current.files).toEqual([{ id: "B-file" }]));
    await act(async () => { old.resolve([{ id: "A-file" }]); });
    expect(result.current.files).toEqual([{ id: "B-file" }]);
    mocks.uid = undefined; rerender();
    expect(result.current.files).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
  it("shows a recoverable file-loading error and supports retry", async () => {
    mocks.files.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([{ id: "recovered" }]);
    const { result } = renderHook(() => useFiles());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    await act(async () => { await result.current.reload(); });
    expect(result.current.error).toBeNull();
    expect(result.current.files).toEqual([{ id: "recovered" }]);
  });
  it("deduplicates simultaneous focus/resume account reads", async () => {
    const pending = deferred<any>(); mocks.single.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useProfile());
    act(() => mocks.appChange?.("active"));
    await waitFor(() => expect(mocks.single).toHaveBeenCalledTimes(1));
    await act(async () => { pending.resolve({ data: { display_name: "latest" }, error: null }); });
    expect(result.current.profile?.display_name).toBe("latest");
  });
  it("does not retain the previous profile after switching accounts", async () => {
    const { result, rerender } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.profile?.display_name).toBe("A"));
    const pending = deferred<any>(); mocks.single.mockReturnValueOnce(pending.promise);
    mocks.uid = "B"; rerender();
    expect(result.current.profile).toBeNull();
    await act(async () => pending.resolve({ data: { display_name: "B" }, error: null }));
    expect(result.current.profile?.display_name).toBe("B");
  });
  it("does not show a prior avatar while a new path is being signed", async () => {
    mocks.signed.mockResolvedValueOnce({ data: { signedUrl: "https://storage.example/A" }, error: null });
    const pending = deferred<any>(); mocks.signed.mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(({ path }) => useAvatarUrl({ user_metadata: { avatar_path: path } }), { initialProps: { path: "A/avatar.jpg" } });
    await waitFor(() => expect(result.current).toBe("https://storage.example/A"));
    rerender({ path: "B/avatar.jpg" });
    expect(result.current).toBeNull();
    await act(async () => pending.resolve({ data: { signedUrl: "https://storage.example/B" }, error: null }));
    expect(result.current).toBe("https://storage.example/B");
  });
});