import { describe, expect, it, vi } from "vitest";
import { nativeGoogleFlow } from "../../mobile/lib/native-google-flow";

function fixture() {
  return {
    webClientId: "test-client.apps.googleusercontent.com",
    configure: vi.fn(),
    hasPlayServices: vi.fn().mockResolvedValue(true),
    signIn: vi.fn().mockResolvedValue({ type: "success", data: { idToken: "test-google-id-token" } }),
    exchange: vi.fn().mockResolvedValue({ error: null, hasSession: true }),
  };
}
describe("Native Google login", () => {
  it("exchanges the native Google token with the shared auth system", async () => {
    const deps = fixture();
    expect(await nativeGoogleFlow(deps)).toBe("signed-in");
    expect(deps.exchange).toHaveBeenCalledWith("test-google-id-token");
  });
  it("cancellation never creates a session", async () => {
    const deps = fixture(); deps.signIn.mockResolvedValue({ type: "cancelled" });
    expect(await nativeGoogleFlow(deps)).toBe("cancelled");
    expect(deps.exchange).not.toHaveBeenCalled();
  });
  it("rejects missing configuration before opening Google", async () => {
    const deps = fixture(); deps.webClientId = "";
    await expect(nativeGoogleFlow(deps)).rejects.toThrow("setup");
    expect(deps.signIn).not.toHaveBeenCalled();
  });
  it("rejects a missing token before contacting auth", async () => {
    const deps = fixture(); deps.signIn.mockResolvedValue({ type: "success", data: { idToken: null } });
    await expect(nativeGoogleFlow(deps)).rejects.toThrow("confirmation");
    expect(deps.exchange).not.toHaveBeenCalled();
  });
  it("does not report success when backend rejects the token", async () => {
    const deps = fixture(); deps.exchange.mockResolvedValue({ error: { message: "Invalid audience" }, hasSession: false });
    await expect(nativeGoogleFlow(deps)).rejects.toThrow("Invalid audience");
  });
});