import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
});