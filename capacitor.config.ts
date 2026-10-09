import type { CapacitorConfig } from "@capacitor/cli";

// App loads the live TenBox website, so website + app share the same database.
const config: CapacitorConfig = {
  appId: "com.tenbox.app",
  appName: "TenBox",
  webDir: "dist/client",
  server: {
    url: "https://id-preview--27b885ad-6120-4d04-a5e6-077528851761.lovable.app",
    cleartext: false,
  },
};

export default config;
