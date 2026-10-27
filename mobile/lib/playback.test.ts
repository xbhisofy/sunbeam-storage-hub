import { describe, expect, it } from "vitest";
import { seekTime, timelineTime } from "./playback";
describe("video seeking", () => {
  it("skips exactly ten seconds forward and back", () => {
    expect(seekTime(30, 10, 100)).toBe(40);
    expect(seekTime(30, -10, 100)).toBe(20);
  });
  it("never seeks outside the video", () => {
    expect(seekTime(5, -10, 100)).toBe(0);
    expect(seekTime(95, 10, 100)).toBe(100);
  });
  it("seeks to the tapped timeline position", () => {
    expect(timelineTime(50, 200, 120)).toBe(30);
    expect(timelineTime(500, 200, 120)).toBe(120);
    expect(timelineTime(50, 0, 120)).toBe(0);
  });
});