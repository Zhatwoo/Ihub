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

const rentalOptions = [
  {
    id: 1,
    title: 'Dedicated Desks',
    description: 'Enjoy a personal, reserved workspace in a dynamic environment—perfect for focused productivity with the flexibility of a shared office.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop',
    color: '#0F766E', // Teal
  },
  {
    id: 3,
    title: 'Private Offices',
    description: 'Designed for growing teams, our medium offices provide ample space, premium amenities, and a collaborative atmosphere to help your business thrive.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop',
    color: '#1F2937', // Dark slate
  },
  {
    id: 4,
    title: 'Virtual Office',
    description: 'A virtual office provides businesses with a professional address, mail handling, and access to administrative support—without the cost of maintaining a physical workspace.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=800&fit=crop',
    color: '#0d6b64', // Darker teal
  },
];

export default function AvailableRentals() {
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section ref={sectionRef} className="relative bg-white py-16 lg:py-24 overflow-hidden">
      {/* Background Gradient - Dark Slate to White */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to top, #1F2937 0%, rgba(31, 41, 55, 0.8) 25%, rgba(31, 41, 55, 0.4) 50%, rgba(255, 255, 255, 0) 100%)'
        }}
      ></div>
      
      {/* Section Title */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 mb-12 lg:mb-16"
        initial={{ y: 50, opacity: 0 }}
        animate={isSectionInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h2 className={`${leagueSpartan.className} text-3xl lg:text-4xl font-bold text-slate-800 mb-2`}>
          Available Rental Spaces
        </h2>
        <div className="w-24 h-1 bg-[#0F766E]"></div>
      </motion.div>

      {/* Color Palette Container - Full Width with scroll animation */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={isSectionInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8"
      >
        {/* Container */}
        <div className="h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-[0_10px_20px_#dbdbdb]">
          {/* Palette Section */}
          <div className="flex h-full w-full">
            {rentalOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ flex: 1 }}
                whileHover={{ flex: 2 }}
                transition={{ duration: 0.1, ease: 'linear' }}
                className="h-full flex-1 flex items-center justify-center text-white font-semibold tracking-wider transition-all duration-100 ease-linear relative group cursor-pointer overflow-hidden"
                style={{ backgroundColor: option.color }}
              >
                {/* Background Image */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                  <Image
                    src={option.image}
                    alt={option.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 h-full">
                  {/* Title and Details - Always centered vertically */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <h3 className={`${leagueSpartan.className} text-xl lg:text-2xl font-bold`}>
                      {option.title}
                    </h3>
                    
                    {/* Description and Button - Show on hover */}
                    <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-100 ease-linear overflow-hidden max-h-0 group-hover:max-h-96 space-y-4">
                      <p className={`${leagueSpartan.className} text-sm lg:text-base leading-relaxed max-w-xs`}>
                        {option.description}
                      </p>
                      <button className={`${leagueSpartan.className} bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-6 py-2 rounded-full transition-all duration-200 text-sm`}>
                        Inquire
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Shadow on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  className="absolute inset-0"
                  style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}
                ></motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
