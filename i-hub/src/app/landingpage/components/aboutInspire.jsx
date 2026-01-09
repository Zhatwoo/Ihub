'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { League_Spartan, Roboto } from 'next/font/google';
import { motion, useInView } from 'framer-motion';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
});

export default function AboutInspire() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section ref={sectionRef} className="relative bg-white py-16 lg:py-24 overflow-hidden">
      {/* 2x2 Grid Layout - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 w-full">
          {/* Top-Left: About Inspire Hub Text Panel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-[#1F2937] p-8 lg:p-12 flex flex-col justify-center min-h-[300px] lg:min-h-[400px]"
          >
            <h2 className={`${leagueSpartan.className} text-3xl lg:text-4xl font-bold text-white mb-6 text-right`}>
              About Inspire Hub
            </h2>
            <p className={`${roboto.className} text-base lg:text-lg text-white leading-relaxed text-right`}>
              At Inspire Hub, we create environments where productivity meets comfort. Our co-working spaces are designed to empower professionals, entrepreneurs, and businesses to thrive in a collaborative and inspiring atmosphere.
            </p>
          </motion.div>

          {/* Top-Right: Open Co-working Space Image */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[300px] lg:h-[400px]"
          >
            <Image
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop"
              alt="Open co-working space with desks and city view"
              fill
              className="object-cover"
              unoptimized
            />
          </motion.div>

          {/* Bottom-Left: Individual Desk with City View Image */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative h-[300px] lg:h-[400px]"
          >
            <Image
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop"
              alt="Individual desk with city view"
              fill
              className="object-cover"
              unoptimized
            />
          </motion.div>

          {/* Bottom-Right: Complimentary Amenities Text Panel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-[#1F2937] p-8 lg:p-12 flex flex-col justify-center min-h-[300px] lg:min-h-[400px]"
          >
            <h2 className={`${leagueSpartan.className} text-3xl lg:text-4xl font-bold text-white mb-6`}>
              Complimentary Amenities
            </h2>
            <p className={`${roboto.className} text-base lg:text-lg text-white leading-relaxed`}>
              From high-speed internet to free coffee, our complimentary offerings ensure that you can focus on what truly matters—growing your business and connecting with others in a comfortable and productive environment.
            </p>
          </motion.div>
        </div>
    </section>
  );
}
