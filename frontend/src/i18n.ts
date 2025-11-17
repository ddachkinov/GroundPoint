import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  // Load translation files
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language (Bulgarian as primary)
    fallbackLng: 'bg',
    // Supported languages
    supportedLngs: ['bg', 'en'],
    // Debug mode (set to false in production)
    debug: import.meta.env.DEV,

    // Detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language in localStorage
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'i18nextLng',
    },

    // Backend options
    backend: {
      // Path to translation files
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Interpolation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },

    // Default namespace
    defaultNS: 'translation',
    ns: ['translation'],

    // React options
    react: {
      // Use Suspense for async loading
      useSuspense: true,
    },
  });

export default i18n;
