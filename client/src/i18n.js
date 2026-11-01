import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ur from './locales/ur.json';

const savedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem('cattlecare-language') : null;

function applyDocumentLanguage(language) {
  if (typeof document === 'undefined') return;
  const isUrdu = language === 'ur';
  document.documentElement.lang = isUrdu ? 'ur' : 'en';
  document.documentElement.dir = isUrdu ? 'rtl' : 'ltr';
  document.documentElement.dataset.language = language;
  document.body?.classList.toggle('urdu-language', isUrdu);
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: savedLanguage === 'ur' ? 'ur' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (language) => {
  applyDocumentLanguage(language);
  if (typeof window !== 'undefined') window.localStorage.setItem('cattlecare-language', language);
});
applyDocumentLanguage(i18n.language);

export default i18n;
