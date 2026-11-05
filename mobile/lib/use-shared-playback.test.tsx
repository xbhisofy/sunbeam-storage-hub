import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSharedPlayback, type PlaybackAd, type SharedPlaybackState } from "./use-shared-playback";

const file: SharedPlaybackState = { kind: "ok", name: "Photo", file_type: "image", mime: "image/jpeg", source: "original", url: "https://example.com/signed" };
function deferred() {
  let resolve: (value: SharedPlaybackState) => void = () => {};
  const promise = new Promise<SharedPlaybackState>(done => { resolve = done; });
  return { promise, resolve };
}
function setup() {
  const listeners = new Map<string, (error?: unknown) => void>();
  const unsub = [vi.fn(), vi.fn(), vi.fn()];
  const show = vi.fn().mockResolvedValue(undefined);
  const ad: PlaybackAd = {
    subscribe: (event, fn) => { listeners.set(event, fn); return unsub[listeners.size - 1]; },
    load: vi.fn(), show,
  };
  const load = vi.fn().mockResolvedValue(file);
  const create = vi.fn(() => ad);
  const record = vi.fn();
  const hook = renderHook(({ slug, user }: { slug: string; user: string | undefined }) => useSharedPlayback(slug, user, load, create, record), { initialProps: { slug: "A", user: "owner" as string | undefined } });
  return { ...hook, load, create, record, listeners, unsub, show };
}
beforeEach(() => vi.useRealTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("shared playback lifecycle", () => {
  it("ignores late file A after file B loads", async () => {
    const a = deferred(), b = deferred();
    const load = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    const hook = renderHook(({ slug }) => useSharedPlayback(slug, "owner", load, vi.fn(), vi.fn()), { initialProps: { slug: "A" } });
    hook.rerender({ slug: "B" });
    await act(async () => b.resolve({ ...file, name: "B" }));
    await act(async () => a.resolve({ ...file, name: "A" }));
    expect(hook.result.current.st).toMatchObject({ name: "B" });
  });
  it("clears open content and rejects old callbacks after logout", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    act(() => h.result.current.showAdThenOpen());
    act(() => h.listeners.get("closed")?.());
    const staleCount = h.result.current.countView;
    expect(h.result.current.open).toBe(true);
    const pending = deferred();
    h.load.mockReturnValueOnce(pending.promise);
    h.rerender({ slug: "A", user: undefined });
    expect(h.result.current.open).toBe(false);
    expect(h.result.current.st.kind).toBe("loading");
    act(staleCount);
    expect(h.record).not.toHaveBeenCalled();
  });
  it("cleans listeners/timer on unmount and ignores late ad load", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    vi.useFakeTimers();
    act(() => h.result.current.showAdThenOpen());
    h.unmount();
    h.listeners.get("loaded")?.();
    act(() => vi.advanceTimersByTime(9000));
    expect(h.show).not.toHaveBeenCalled();
    h.unsub.forEach(fn => expect(fn).toHaveBeenCalledTimes(1));
    expect(vi.getTimerCount()).toBe(0);
  });
  it("finishes once and cleans listeners on close", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    vi.useFakeTimers();
    act(() => { h.result.current.showAdThenOpen(); h.result.current.showAdThenOpen(); });
    act(() => { h.listeners.get("closed")?.(); h.listeners.get("closed")?.(); });
    expect(h.create).toHaveBeenCalledTimes(1);
    expect(h.result.current.open).toBe(true);
    h.unsub.forEach(fn => expect(fn).toHaveBeenCalledTimes(1));
    expect(vi.getTimerCount()).toBe(0);
  });
  it("offers retry on the eight-second timeout and prevents a late ad from showing", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    vi.useFakeTimers();
    act(() => h.result.current.showAdThenOpen());
    act(() => vi.advanceTimersByTime(8000));
    h.listeners.get("loaded")?.();
    expect(h.result.current.open).toBe(false);
    expect(h.result.current.adUnavailable).toBe(true);
    expect(h.show).not.toHaveBeenCalled();
    h.unsub.forEach(fn => expect(fn).toHaveBeenCalledTimes(1));
  });
  it("does not unlock underneath an already showing ad", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    vi.useFakeTimers();
    act(() => h.result.current.showAdThenOpen());
    await act(async () => h.listeners.get("loaded")?.());
    act(() => vi.advanceTimersByTime(9000));
    expect(h.result.current.open).toBe(false);
    act(() => h.listeners.get("closed")?.());
    expect(h.result.current.open).toBe(true);
  });
  it("cleans up on show rejection", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    h.show.mockRejectedValueOnce(new Error("Test SDK rejection"));
    act(() => h.result.current.showAdThenOpen());
    await act(async () => h.listeners.get("loaded")?.());
    expect(h.result.current.open).toBe(false);
    expect(h.result.current.adUnavailable).toBe(true);
    h.unsub.forEach(fn => expect(fn).toHaveBeenCalledTimes(1));
  });
  it("offers retry on network failure, then opens after a successful new ad closes", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    act(() => h.result.current.showAdThenOpen());
    const staleClose = h.listeners.get("closed");
    act(() => h.listeners.get("error")?.({ code: "googleMobileAds/network-error" }));
    expect(h.result.current.open).toBe(false);
    expect(h.result.current.adUnavailable).toBe(true);
    act(() => h.result.current.countView());
    expect(h.record).not.toHaveBeenCalled();
    act(() => h.result.current.showAdThenOpen());
    expect(h.result.current.adUnavailable).toBe(false);
    act(() => staleClose?.());
    expect(h.result.current.open).toBe(false);
    await act(async () => h.listeners.get("loaded")?.());
    expect(h.show).toHaveBeenCalledTimes(1);
    act(() => h.listeners.get("closed")?.());
    expect(h.result.current.open).toBe(true);
    expect(h.create).toHaveBeenCalledTimes(2);
  });
  it("preserves automatic fallback for explicit provider no-fill", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    act(() => h.result.current.showAdThenOpen());
    act(() => h.listeners.get("error")?.({ code: "googleMobileAds/no-fill" }));
    expect(h.result.current.open).toBe(true);
    expect(h.result.current.adUnavailable).toBe(false);
    expect(h.show).not.toHaveBeenCalled();
  });
  it("allows Continue only after ad unavailability, not during loading", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    act(() => h.result.current.continueWithoutAd());
    expect(h.result.current.open).toBe(false);
    act(() => h.result.current.showAdThenOpen());
    act(() => h.result.current.continueWithoutAd());
    expect(h.result.current.open).toBe(false);
    act(() => h.listeners.get("error")?.({ code: "internal-error" }));
    act(() => h.result.current.continueWithoutAd());
    expect(h.result.current.open).toBe(true);
    expect(h.result.current.adUnavailable).toBe(false);
  });
  it("clears retry state and rejects stale Continue after changing files", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    act(() => h.result.current.showAdThenOpen());
    act(() => h.listeners.get("error")?.());
    const staleContinue = h.result.current.continueWithoutAd;
    h.rerender({ slug: "B", user: "owner" });
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    act(staleContinue);
    expect(h.result.current.open).toBe(false);
    expect(h.result.current.adUnavailable).toBe(false);
  });
  it("resets view counting per slug and blocks stale ad completion", async () => {
    const h = setup();
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    act(() => h.result.current.showAdThenOpen());
    act(() => h.listeners.get("closed")?.());
    act(() => { h.result.current.countView(); h.result.current.countView(); });
    expect(h.record.mock.calls).toEqual([["A"]]);
    const oldClose = h.listeners.get("closed");
    h.rerender({ slug: "B", user: "owner" });
    await waitFor(() => expect(h.result.current.st.kind).toBe("ok"));
    act(() => oldClose?.());
    expect(h.result.current.open).toBe(false);
    act(() => h.result.current.showAdThenOpen());
    act(() => h.listeners.get("closed")?.());
    act(() => h.result.current.countView());
    expect(h.record.mock.calls).toEqual([["A"], ["B"]]);
  });
});