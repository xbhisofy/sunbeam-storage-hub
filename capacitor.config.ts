import type { CapacitorConfig } from "@capacitor/cli";

// App loads the live Tanyora website, so website + app share the same database.
const config: CapacitorConfig = {
  appId: "com.tanyora.app",
  appName: "Tanyora",
  webDir: "dist/client",
  server: {
    url: "https://sunbeam-storage-hub.lovable.app",
    cleartext: false,
  },
};

export default config;
