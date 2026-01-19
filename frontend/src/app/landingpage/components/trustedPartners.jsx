'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';

export default function TrustedPartners() {
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div 
          className="text-center mb-8 sm:mb-12 lg:mb-16"
          initial={{ y: 50, opacity: 0 }}
          animate={isSectionInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2937] mb-3 sm:mb-4">
            Our Trusted Partners
          </h2>
          <div className="w-24 sm:w-32 h-1 bg-[#0F766E] mx-auto"></div>
        </motion.div>

        {/* Logos Grid */}
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          {/* Top Row - 4 Logos */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-12 items-center justify-items-center"
            initial={{ y: 50, opacity: 0 }}
            animate={isSectionInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            {/* SMDC */}
            <div className="flex items-center justify-center w-full h-16 sm:h-20 relative">
              <Image
                src="/LOGOS/SMDC.png"
                alt="SMDC Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
            </div>

            {/* Vista Land */}
            <div className="flex items-center justify-center w-full h-16 sm:h-20 relative">
              <Image
                src="/LOGOS/Vista Land.png"
                alt="Vista Land Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
            </div>

            {/* Alliance Global */}
            <div className="flex items-center justify-center w-full h-16 sm:h-20 relative">
              <Image
                src="/LOGOS/Alliance Global.png"
                alt="Alliance Global Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
            </div>

            {/* AyalaLand */}
            <div className="flex items-center justify-center w-full h-16 sm:h-20 relative">
              <Image
                src="/LOGOS/Ayala land.png"
                alt="AyalaLand Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Bottom Row - 3 Logos Centered */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-12"
            initial={{ y: 50, opacity: 0 }}
            animate={isSectionInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
          >
            {/* Megaworld International */}
            <div className="flex items-center justify-center w-full sm:w-[180px] lg:w-[250px] h-16 sm:h-20 relative">
              <Image
                src="/LOGOS/Megaworld.png"
                alt="Megaworld International Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
            </div>

            {/* UnionBank */}
            <div className="flex items-center justify-center w-full sm:w-[180px] lg:w-[250px] h-16 sm:h-20 relative">
              <Image
                src="/LOGOS/UB.png"
                alt="UnionBank Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
            </div>

            {/* GM Fastcash Lending Corporation */}
            <div className="flex items-center justify-center w-full sm:w-[180px] lg:w-[250px] h-16 sm:h-20 relative">
              <Image
                src="/LOGOS/GM.png"
                alt="GM Fastcash Lending Corporation Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
