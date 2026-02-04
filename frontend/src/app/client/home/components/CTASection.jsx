'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/TranslationContext';

export default function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-[#1F2937] mb-4">{t('client.ctaSection.title')}</h2>
        <p className="text-[#1F2937] mb-8">{t('client.ctaSection.subtitle')}</p>
        <Link href="/landingpage/contacts?returnTo=/client/home" className="inline-block px-8 py-4 bg-[#0F766E] text-white rounded-xl font-semibold shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all">
          {t('client.ctaSection.button')}
        </Link>
      </div>
    </section>
  );
}

