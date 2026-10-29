import '../../global.css';

import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { database } from '@/db/database';
import i18n from '@/i18n';
import { NAV_THEME } from '@/lib/theme';

function RootStack() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('home.title') }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme ?? 'light'];

  return (
    <SafeAreaProvider>
      <DatabaseProvider database={database}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider value={theme}>
            <StatusBar style="auto" />
            <RootStack />
          </ThemeProvider>
        </I18nextProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
