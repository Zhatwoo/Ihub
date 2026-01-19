'use client';

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
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
            WHY CHOOSE US
          </div>
          <h2 className={`${leagueSpartan.className} text-4xl font-bold mb-4`}>Why You Choose Us</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Experience the perfect blend of professional workspace, modern amenities, and exceptional service that sets us apart from the rest.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Videos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-48 rounded-lg overflow-hidden">
              <video
                src="/bg/Why you choose uu/Why you choose us video.mp4"
                poster="/bg/Why you choose uu/Why you choose us video.png"
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Why choose us video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <video
                src="/bg/Why you choose uu/why video 2.mp4"
                poster="/bg/Why you choose uu/why video 2.png"
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Modern workspace video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <video
                src="/bg/Why you choose uu/Why video 3.mp4"
                poster="/bg/Why you choose uu/Why video 3.png"
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Meeting room video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <video
                src="/bg/Why you choose uu/Why video 4.mp4"
                poster="/bg/Why you choose uu/Why video 4.png"
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Office space video"
              >
                Your browser does not support the video tag.
              </video>
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
