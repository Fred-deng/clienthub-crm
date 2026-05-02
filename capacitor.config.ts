import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.6be86a77bdcf43f5a7880ca03fec20bd",
  appName: "集马科技",
  webDir: "dist",
  // 开发期：热重载到 Lovable 沙箱。正式打包上架前请删除整个 server 段。
  server: {
    url: "https://6be86a77-bdcf-43f5-a788-0ca03fec20bd.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: { contentInset: "always" },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#F8F4EC",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
