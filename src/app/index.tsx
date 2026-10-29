import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="flex-grow items-center justify-center gap-6 p-6"
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text variant="h1">{t('home.title')}</Text>
      <Button onPress={() => router.push('/settings')}>
        <Text>{t('home.openSettings')}</Text>
      </Button>
    </ScrollView>
  );
}
