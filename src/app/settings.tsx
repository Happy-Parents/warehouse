import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Text } from '@/components/ui/text';

type DiagnosticState =
  | { status: 'checking' }
  | { status: 'ready'; version: number }
  | { status: 'failed'; message: string };

export default function SettingsScreen() {
  const { t } = useTranslation();
  const database = useDatabase();
  const [diagnostic, setDiagnostic] = useState<DiagnosticState>({ status: 'checking' });

  useEffect(() => {
    let cancelled = false;

    // One round trip through the adapter proves the native database opened.
    database.localStorage
      .get('smoke')
      .then(() => {
        if (!cancelled) {
          setDiagnostic({ status: 'ready', version: database.schema.version });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          setDiagnostic({ status: 'failed', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [database]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="flex-grow gap-4 p-6"
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text variant="h1">{t('settings.title')}</Text>
      <Text variant="muted">{t('settings.databaseStatus')}</Text>
      <Text testID="database-diagnostic">
        {diagnostic.status === 'ready' &&
          t('settings.databaseReady', { version: diagnostic.version })}
        {diagnostic.status === 'failed' &&
          t('settings.databaseError', { message: diagnostic.message })}
      </Text>
    </ScrollView>
  );
}
