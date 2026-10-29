import type { ExpoConfig } from 'expo/config';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('EXPO_PUBLIC_API_URL is not set; copy .env.example to .env');
}

const config: ExpoConfig = {
  name: 'Warehouse',
  slug: 'warehouse',
  scheme: 'warehouse',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.hp.warehouse.app',
    supportsTablet: false,
    appleTeamId: process.env.APPLE_TEAM_ID,
  },
  android: {
    package: 'com.hp.warehouse.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    'expo-secure-store',
    'expo-localization',
    '@morrowdigital/watermelondb-expo-plugin',
  ],
};

export default config;
