import { describe, expect, it } from "vitest";
import { isAdNoFill } from "./ad-error";

describe("provider ad availability", () => {
  it.each(["no-fill", "googleMobileAds/no-fill", "error-code-no-fill", "mediation-no-fill"])("recognizes explicit %s", code => {
    expect(isAdNoFill({ code })).toBe(true);
  });
  it.each([undefined, null, { code: "network-error" }, { code: "internal-error" }, { message: "no-fill" }, { code: "not-no-fill" }])("does not infer no-fill or blocking from %j", error => {
    expect(isAdNoFill(error)).toBe(false);
  });
});