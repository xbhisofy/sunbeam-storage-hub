import { describe, expect, it } from "vitest";
import { MEDIA_NOTICE_VERSION, needsNotice } from "./consent";

describe("media access notice", () => {
  it("is shown before the first photo/video pick", () => {
    expect(needsNotice(null)).toBe(true);
  });
  it("is shown again when the notice version changes", () => {
    expect(needsNotice({ version: "old", acceptedAt: "2026-01-01T00:00:00Z" })).toBe(true);
  });
  it("is not repeated once the current version is accepted", () => {
    expect(needsNotice({ version: MEDIA_NOTICE_VERSION, acceptedAt: "2026-10-15T00:00:00Z" })).toBe(false);
  });
});
