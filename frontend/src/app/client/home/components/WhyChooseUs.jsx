'use client';

import Image from 'next/image';
import { League_Spartan } from 'next/font/google';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

const reasons = [
  {
    id: 1,
    title: 'Prime Location & Modern Facilities',
    description: 'Strategically located in Alliance Global Tower with state-of-the-art facilities, high-speed internet, and premium amenities designed for productivity and success.'
  },
  {
    id: 2,
    title: 'Flexible Workspace Solutions',
    description: 'Choose from dedicated desks, private offices, or virtual office services. We offer flexible terms that adapt to your business needs, whether you need daily, monthly, or long-term arrangements.'
  },
  {
    id: 3,
    title: 'Exceptional Support & Service',
    description: 'Our dedicated team is committed to providing exceptional customer service, ensuring your workspace needs are met with professionalism and care every step of the way.'
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-slate-900 text-white">
      <div className="max-w-[90rem] mx-auto px-8 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className={`${leagueSpartan.className} text-4xl font-bold mb-4`}>Why You Choose Us</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Experience the perfect blend of professional workspace, modern amenities, and exceptional service that sets us apart from the rest.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Images */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image
                src="/images/IMG_5337.jpg"
                alt="Team collaboration"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image
                src="/images/IMG_5335.jpg"
                alt="Modern workspace"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image
                src="/images/IMG_5334.jpg"
                alt="Meeting room"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image
                src="/images/IMG_5333.jpg"
                alt="Office space"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Reasons */}
          <div className="space-y-6">
            {reasons.map((reason) => (
              <div key={reason.id} className="border-l-4 border-teal-500 pl-4">
                <h3 className="text-lg font-semibold mb-2">{reason.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
