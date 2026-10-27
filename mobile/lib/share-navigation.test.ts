import { describe, expect, it } from "vitest";
import { shareDestinationFromUrl } from "./share-navigation";
describe("native share URL boundary", () => {
  it.each(["https://tanyora.com/s/photo_123", "https://app.tanyora.com/s/photo_123", "https://www.tanyora.com/s/photo_123", "tanyora://s/photo_123", "/s/photo_123"])("routes exact trusted share URL internally: %s", value => {
    expect(shareDestinationFromUrl(value)).toBe("/s/photo_123");
  });
  it.each(["https://evil.example/s/photo_123", "https://tanyora.com.evil.example/s/photo_123", "http://tanyora.com/s/photo_123", "https://user@tanyora.com/s/photo_123", "https://tanyora.com:8443/s/photo_123", "https://tanyora.com/s/photo_123?next=https://evil.example", "https://tanyora.com/s/photo_123/extra", "https://tanyora.com/s/%2e%2e/photo_123", "https://tanyora.com/other/../s/photo_123", "tanyora://other/s/photo_123", "//evil.example/s/photo_123", "https://tanyora.com/s/photo_123#extra"])("rejects unsafe or unrelated URL: %s", value => {
    expect(shareDestinationFromUrl(value)).toBeNull();
  });
});