import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

// Initialize i18next for backend
i18next
  .use(Backend)
  .init({
    // Default language (Bulgarian as primary)
    fallbackLng: 'bg',
    // Supported languages
    supportedLngs: ['bg', 'en'],
    // Don't load resources for language codes
    load: 'languageOnly',
    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',
    // Backend configuration
    backend: {
      // Path to translation files
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
    },
    // Interpolation options
    interpolation: {
      // Don't escape values (we're not rendering HTML in Node)
      escapeValue: false,
    },
    // Disable debug in production
    debug: process.env.NODE_ENV === 'development',
  });

export default i18next;
