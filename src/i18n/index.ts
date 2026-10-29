import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import uk from './locales/uk.json';

export const SUPPORTED_LANGUAGES = ['uk', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Ukrainian is the project default; any other detectable language falls back to English. */
export function resolveLanguage(deviceLanguageCode: string | undefined): SupportedLanguage {
  if (deviceLanguageCode === undefined || deviceLanguageCode === 'uk') {
    return 'uk';
  }
  return 'en';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: {
    uk: { translation: uk },
    en: { translation: en },
  },
  lng: resolveLanguage(getLocales()[0]?.languageCode ?? undefined),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
