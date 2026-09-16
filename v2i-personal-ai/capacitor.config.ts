import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.v2i.personalai",
  appName: "V2i Personal AI",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_v2i",
      iconColor: "#22D3EE",
    },
  },
};

export default config;
