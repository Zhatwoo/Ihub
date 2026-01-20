'use client';

import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-[#1F2937] mb-4">Ready to Book Your Space?</h2>
        <p className="text-[#1F2937] mb-8">Get started today and find the perfect room for your next meeting or event.</p>
        <Link href="/client/private-offices" className="inline-block px-8 py-4 bg-[#0F766E] text-white rounded-xl font-semibold shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all">
          Inquire Now
        </Link>
      </div>
    </section>
  );
}

