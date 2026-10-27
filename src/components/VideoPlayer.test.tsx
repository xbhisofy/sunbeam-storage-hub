import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "./VideoPlayer";

afterEach(cleanup);
beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});

describe("custom video playback", () => {
  it.each([2, 3])("sets actual playback to %sx", (speed) => {
    const { container } = render(<VideoPlayer src="/video.mp4" title="Shared video" />);
    fireEvent.click(screen.getByRole("button", { name: "Playback speed" }));
    fireEvent.click(screen.getByRole("button", { name: `${speed}x` }));
    expect(container.querySelector("video")?.playbackRate).toBe(speed);
  });

  it("seeks backward and forward by ten seconds with bounds", () => {
    const { container } = render(<VideoPlayer src="/video.mp4" title="Shared video" />);
    const video = container.querySelector("video");
    if (!video) throw new Error("Missing media element");
    Object.defineProperty(video, "duration", { configurable: true, value: 60 });
    video.currentTime = 5;
    fireEvent.loadedMetadata(video);
    fireEvent.timeUpdate(video);
    fireEvent.click(screen.getByRole("button", { name: "Rewind 10 seconds" }));
    expect(video.currentTime).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Forward 10 seconds" }));
    expect(video.currentTime).toBe(10);
  });

  it("requests fullscreen on the custom player wrapper", () => {
    render(<VideoPlayer src="/video.mp4" title="Shared video" />);
    const frame = screen.getByRole("region");
    const request = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(frame, "requestFullscreen", { value: request });
    fireEvent.click(screen.getByRole("button", { name: "Fullscreen" }));
    expect(request).toHaveBeenCalledOnce();
  });
  it("clamps forward ten seconds at the end", () => {
    const { container } = render(<VideoPlayer src="/video.mp4" title="Shared video" />);
    const video = container.querySelector("video");
    if (!video) throw new Error("Missing video");
    Object.defineProperty(video, "duration", { configurable: true, value: 60 });
    video.currentTime = 56;
    fireEvent.loadedMetadata(video); fireEvent.timeUpdate(video);
    fireEvent.click(screen.getByRole("button", { name: "Forward 10 seconds" }));
    expect(video.currentTime).toBe(60);
  });
  it("enables actual repeat playback", () => {
    const { container } = render(<VideoPlayer src="/video.mp4" title="Shared video" />);
    fireEvent.click(screen.getByRole("button", { name: "Repeat video" }));
    expect(container.querySelector("video")?.loop).toBe(true);
  });
  it("locks playback controls until unlocked", () => {
    const { container } = render(<VideoPlayer src="/video.mp4" title="Shared video" />);
    const video = container.querySelector("video");
    if (!video) throw new Error("Missing video");
    const play = vi.fn(); video.play = play;
    fireEvent.click(screen.getByRole("button", { name: "Lock controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Unlock controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    expect(play).toHaveBeenCalledOnce();
  });
  it("uses landscape fallback and returns to portrait when orientation locking is unavailable", async () => {
    render(<VideoPlayer src="/video.mp4" title="Shared video" />);
    fireEvent.click(screen.getByRole("button", { name: "Rotate to landscape" }));
    await waitFor(() => expect(screen.getByRole("region").classList.contains("player-rotated")).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "Rotate to portrait" }));
    await waitFor(() => expect(screen.getByRole("region").classList.contains("player-rotated")).toBe(false));
  });
});