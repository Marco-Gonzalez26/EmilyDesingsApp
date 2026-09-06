import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.emilydesigns.mobile',
  appName: 'EmilyDesigns',
  webDir: 'www',
  server: {
    cleartext: true,
    androidScheme: 'http',
  },
  android: {
    backgroundColor: '#fefefa',
  },
};


export default config;
