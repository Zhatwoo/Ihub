'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import en from '@/lib/translations/en.json';
import ja from '@/lib/translations/ja.json';

const translations = { en, ja };
const LOCALE_KEY = 'ihub-locale';

function get(obj, path) {
  if (!path) return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
}

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_KEY);
      if (stored === 'ja' || stored === 'en') setLocaleState(stored);
    } catch (_) {}
  }, []);

  const setLocale = useCallback((next) => {
    const value = typeof next === 'function' ? next((l) => l) : next;
    const valid = value === 'ja' ? 'ja' : 'en';
    setLocaleState(valid);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCALE_KEY, valid);
      } catch (_) {}
    }
  }, []);

  const t = useCallback(
    (key) => {
      const value = get(translations[locale], key);
      return value != null ? String(value) : key;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ t, locale, setLocale, translations: translations[locale] }),
    [t, locale, setLocale]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    return {
      t: (key) => key,
      locale: 'en',
      setLocale: () => {},
      translations: en,
    };
  }
  return ctx;
}
