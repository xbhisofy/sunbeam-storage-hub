import type { CapacitorConfig } from "@capacitor/cli";

// App loads the live Tanyora website, so website + app share the same database.
const config: CapacitorConfig = {
  appId: "com.tanyora.app",
  appName: "Tanyora",
  webDir: "dist/client",
  server: {
    url: "https://app.tanyora.com",
    cleartext: false,
  },
};

export default config;
