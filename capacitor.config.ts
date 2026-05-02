import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.6be86a77bdcf43f5a7880ca03fec20bd",
  appName: "集马科技",
  webDir: "dist",
  server: {
    url: "https://6be86a77-bdcf-43f5-a788-0ca03fec20bd.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: { contentInset: "always" },
};

export default config;
