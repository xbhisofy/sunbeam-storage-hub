import { describe, it, expect } from "vitest";
import { linkExpiry } from "./shared-links";
const now = Date.parse("2026-10-27T07:03:00Z");
describe("shared link expiry", () => {
  it("shows no expiry only for a genuinely null expiry", () => {
    expect(linkExpiry(null, now)).toEqual({ kind: "never", label: "Never expires" });
    expect(linkExpiry("invalid", now).kind).toBe("unknown");
  });
  it("marks past and exact-boundary links expired", () => {
    expect(linkExpiry("2026-10-27T07:02:59Z", now).kind).toBe("expired");
    expect(linkExpiry("2026-10-27T07:03:00Z", now).kind).toBe("expired");
  });
  it("keeps future expiry active", () => {
    expect(linkExpiry("2026-10-28T07:03:00Z", now).kind).toBe("active");
  });
});