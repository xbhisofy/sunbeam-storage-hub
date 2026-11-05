import { describe, expect, it, vi } from "vitest";
import { dedupeReads } from "./request-cache";

describe("Concurrent native account reads", () => {
  it("shares concurrent requests for the same account but never between accounts", async () => {
    const fetcher = vi.fn(async (uid: string) => uid);
    const read = dedupeReads(fetcher);
    const first = read("A");
    expect(read("A")).toBe(first);
    expect(read("B")).not.toBe(first);
    expect(await first).toBe("A");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("refetches after a settled read so externally changed plans are fresh", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce("free").mockResolvedValueOnce("pro");
    const read = dedupeReads(fetcher);
    expect(await read("A")).toBe("free");
    expect(await read("A")).toBe("pro");
  });
  it("releases failed requests for a genuine retry", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([]);
    const read = dedupeReads(fetcher);
    await expect(read("A")).rejects.toThrow("offline");
    expect(await read("A")).toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});