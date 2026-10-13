import { describe, expect, it } from "vitest";
import { fileMetadata, formatFileDate } from "./format";

const file = { size: 348569, created_at: "2026-10-13T10:00:00Z", views: 42 };

describe("file metadata", () => {
  it("excludes view counts in the installed app", () => {
    expect(fileMetadata(file, true)).toBe("340.4 KB · 13 Oct 2026");
  });
  it("keeps view counts available on the website", () => {
    expect(fileMetadata(file, false)).toBe("340.4 KB · 13 Oct 2026 · 42 views");
  });
  it("uses upload dates instead of negative relative times", () => {
    expect(formatFileDate("2026-10-14T10:00:00Z")).toBe("14 Oct 2026");
  });
});