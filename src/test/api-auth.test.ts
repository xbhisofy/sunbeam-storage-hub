import { describe, expect, it } from "vitest";
import { bearerTokenFrom, requireBearerUserId } from "@/lib/api-auth";

// Public API routes verify the caller themselves — no token, no access.
describe("Public delete-account endpoint authentication", () => {
  it("rejects requests without an Authorization header", async () => {
    const request = new Request("https://example.com/api/public/delete-account", { method: "POST" });
    await expect(requireBearerUserId(request)).rejects.toMatchObject({ status: 401 });
  });

  it("rejects empty bearer tokens", async () => {
    const request = new Request("https://example.com/api/public/delete-account", {
      method: "POST",
      headers: { Authorization: "Bearer " },
    });
    expect(bearerTokenFrom(request)).toBe("");
    await expect(requireBearerUserId(request)).rejects.toMatchObject({ status: 401 });
  });
});
