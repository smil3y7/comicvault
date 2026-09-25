import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import sl from './sl.json';
import en from './en.json';

// To add a new language: create xx.json with the same keys as sl.json/en.json,
// import it above, and add one line to this list. Nothing else in the app
// needs to change.
export const LANGUAGES = [
  { code: 'sl', label: 'Slovenščina', dict: sl },
  { code: 'en', label: 'English', dict: en },
];

const STORAGE_KEY = 'comicvault:lang';
const I18nContext = createContext(null);

function resolve(dict, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));
}

function detectDefaultLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  const browserLang = (navigator.language || 'en').slice(0, 2);
  return LANGUAGES.some((l) => l.code === browserLang) ? browserLang : 'en';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectDefaultLanguage);

  const setLang = useCallback((code) => {
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const dict = LANGUAGES.find((l) => l.code === lang)?.dict ?? en;
  const fallbackDict = en;

  const t = useCallback(
    (key, vars) => {
      const value = resolve(dict, key) ?? resolve(fallbackDict, key) ?? key;
      return typeof value === 'string' ? interpolate(value, vars) : value;
    },
    [dict],
  );

  const value = useMemo(() => ({ lang, setLang, t, languages: LANGUAGES }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
