import { describe, it, expect } from "vitest";
import { hostRedirect } from "./app-mode";
const M = "https://tanyora.com", W = "https://app.tanyora.com";
describe("hostRedirect", () => {
  it("keeps landing on main domain", () => expect(hostRedirect("tanyora.com", "/", M, W)).toBeNull());
  it("keeps share links on main domain", () => expect(hostRedirect("tanyora.com", "/s/abc", M, W)).toBeNull());
  it("sends login on main to subdomain", () => expect(hostRedirect("tanyora.com", "/auth", M, W)).toBe("https://app.tanyora.com/auth"));
  it("sends share links on subdomain to main", () => expect(hostRedirect("app.tanyora.com", "/s/abc", M, W)).toBe("https://tanyora.com/s/abc"));
  it("does nothing when both hosts are same", () => expect(hostRedirect("x.lovable.app", "/auth", "https://x.lovable.app", "https://x.lovable.app")).toBeNull());
});
