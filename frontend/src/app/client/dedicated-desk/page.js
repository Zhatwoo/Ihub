'use client';

import { useTranslation } from '@/lib/TranslationContext';

export default function DedicatedDesk() {
  const { t } = useTranslation();
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">{t('client.dedicatedDesk.title')}</h1>
    </div>
  );
}
