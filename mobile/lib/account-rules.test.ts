import { describe, expect, it } from "vitest";
import { currentPlan, sharedDestination, validateProfile } from "./account-rules";

describe("native account rules", () => {
  const now = Date.parse("2026-10-15T12:00:00Z");
  it("shows Free without an active subscription", () => {
    expect(currentPlan(null, now).name).toBe("Free");
    expect(currentPlan({ display_name: null, email: null, premium_tier: "plus", premium_until: "2026-10-14" }, now).tier).toBe("free");
  });
  it("reflects website Plus upgrades with 100 GB", () => {
    expect(currentPlan({ display_name: null, email: null, premium_tier: "plus", premium_until: "2026-11-14" }, now)).toEqual({ tier: "plus", name: "Plus", storage: 100 * 1024 ** 3 });
  });
  it("reflects website Pro upgrades with 1 TB", () => {
    expect(currentPlan({ display_name: null, email: null, premium_tier: "pro", premium_until: "2026-11-14" }, now).storage).toBe(1024 ** 4);
  });
  it("requires a valid name and email for profile edits", () => {
    expect(validateProfile("", "user@example.com")).not.toBeNull();
    expect(validateProfile("Sam", "wrong")).not.toBeNull();
    expect(validateProfile("Sam", "user@example.com")).toBeNull();
  });
  it("restores only a shared-file destination after sign-in", () => {
    expect(sharedDestination("/s/abc123")).toBe("/s/abc123");
    expect(sharedDestination("https://example.com/s/abc123")).toBeNull();
    expect(sharedDestination("/s/../../plans")).toBeNull();
    expect(sharedDestination("/plans")).toBeNull();
  });
});
