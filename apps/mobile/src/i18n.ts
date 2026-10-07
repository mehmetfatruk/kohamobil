import { DEFAULT_LOCALE, resolveLocale, resources } from '@mirakil/i18n';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const deviceLanguage = getLocales()[0]?.languageCode;

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: resources.tr },
    en: { translation: resources.en },
  },
  lng: resolveLocale(deviceLanguage),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
