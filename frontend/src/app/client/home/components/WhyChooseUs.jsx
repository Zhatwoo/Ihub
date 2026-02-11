'use client';

import { League_Spartan } from 'next/font/google';
import Image from 'next/image';
import { useTranslation } from '@/lib/TranslationContext';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

const reasonKeys = [
  { id: 1, titleKey: 'client.whyChooseUs.reason1Title', descKey: 'client.whyChooseUs.reason1Desc' },
  { id: 2, titleKey: 'client.whyChooseUs.reason2Title', descKey: 'client.whyChooseUs.reason2Desc' },
  { id: 3, titleKey: 'client.whyChooseUs.reason3Title', descKey: 'client.whyChooseUs.reason3Desc' },
];

export default function WhyChooseUs() {
  const { t } = useTranslation();
  return (
    <section className="py-16 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
            {t('client.whyChooseUs.pill')}
          </div>
          <h2 className={`${leagueSpartan.className} text-4xl font-bold mb-4`}>{t('client.whyChooseUs.title')}</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            {t('client.whyChooseUs.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image src="/bg/Why you choose uu/Why you choose us video.png" alt={t('client.whyChooseUs.title')} fill className="object-cover" />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image src="/bg/Why you choose uu/why video 2.png" alt="Modern workspace" fill className="object-cover" />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image src="/bg/Why you choose uu/Why video 3.png" alt="Meeting room" fill className="object-cover" />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image src="/bg/Why you choose uu/Why video 4.png" alt="Office space" fill className="object-cover" />
            </div>
          </div>

          <div className="space-y-6">
            {reasonKeys.map((r) => (
              <div key={r.id} className="border-l-4 border-teal-500 pl-4">
                <h3 className="text-lg font-semibold mb-2">{t(r.titleKey)}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{t(r.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
