import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  resources,
  DEFAULT_NS,
  NAMESPACES,
  SUPPORTED_LOCALES,
  isRtlLocale,
  matchSupportedLocale,
  type Locale,
} from '@rc/i18n';

const STORAGE_KEY = 'rc:locale';

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {
    /* localStorage may throw under privacy mode */
  }
  const navLangs: readonly string[] =
    (window.navigator?.languages as readonly string[] | undefined) ??
    (window.navigator?.language ? [window.navigator.language] : []);
  for (const tag of navLangs) {
    const matched = matchSupportedLocale(tag);
    if (matched) return matched;
  }
  return 'en';
}

const initialLng = detectInitialLocale();

function applyHtmlAttrs(lng: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng;
  document.documentElement.dir = isRtlLocale(lng) ? 'rtl' : 'ltr';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: 'en',
  defaultNS: DEFAULT_NS,
  ns: NAMESPACES as unknown as string[],
  interpolation: { escapeValue: false },
});

applyHtmlAttrs(initialLng);
i18n.on('languageChanged', applyHtmlAttrs);

export default i18n;
