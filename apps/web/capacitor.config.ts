import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sportmanager.pro',
  appName: 'SportManager Pro',
  webDir: 'out',
  server: {
    // For development with local API:
    // url: 'http://10.0.2.2:3000',
    // cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
