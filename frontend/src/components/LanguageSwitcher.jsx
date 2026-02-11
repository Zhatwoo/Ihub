'use client';

import { useTranslation } from '@/lib/TranslationContext';

export default function LanguageSwitcher({ className = '', variant = 'dark' }) {
  const { locale, setLocale } = useTranslation();
  const isLight = variant === 'light';

  const activeClass = isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-white';
  const inactiveClass = isLight ? 'text-slate-600 hover:text-slate-800' : 'text-white/80 hover:text-white';
  const separatorClass = isLight ? 'text-slate-400' : 'text-white/60';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${locale === 'en' ? activeClass : inactiveClass}`}
        aria-label="English"
      >
        EN
      </button>
      <span className={separatorClass}>|</span>
      <button
        type="button"
        onClick={() => setLocale('ja')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${locale === 'ja' ? activeClass : inactiveClass}`}
        aria-label="日本語"
      >
        日本語
      </button>
    </div>
  );
}
