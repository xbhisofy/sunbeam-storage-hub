import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "mobile/lib/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    // Native helpers have their own React installation; the DOM test renderer
    // must use one dispatcher. This does not change either application's build.
    alias: { "@": path.resolve(__dirname, "./src"), react: path.resolve(__dirname, "./node_modules/react") },
  },
});
