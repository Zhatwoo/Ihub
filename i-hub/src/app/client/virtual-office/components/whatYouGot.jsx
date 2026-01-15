'use client';

import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function WhatYouGot({ children }) {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const isHeadingInView = useInView(headingRef, { once: true, amount: 0.3 });
  const isCardsInView = useInView(cardsRef, { once: true, amount: 0.2 });

  return (
    <section ref={sectionRef} className="w-full bg-[#F8FAFC] min-h-[70vh] relative">
      {/* What You Get Heading */}
      <motion.div 
        ref={headingRef}
        initial={{ opacity: 0, y: -30 }}
        animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full flex items-center justify-center pt-16 pb-8"
      >
        <div className="flex items-center gap-3">
          {/* Orange Star Icon */}
          <motion.svg 
            initial={{ opacity: 0, rotate: -180, scale: 0 }}
            animate={isHeadingInView ? { opacity: 1, rotate: 0, scale: 1 } : { opacity: 0, rotate: -180, scale: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#FF6B35" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="shrink-0"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </motion.svg>
          {/* What You Get Text */}
          <motion.h2 
            initial={{ opacity: 0, x: 20 }}
            animate={isHeadingInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
            className="text-gray-800 text-4xl font-bold"
          >
            What You Get
          </motion.h2>
        </div>
      </motion.div>
      {/* Cards Container */}
      <div ref={cardsRef} className="w-full flex justify-center items-stretch gap-6 flex-wrap px-8 py-8 pb-22 relative z-10">
        {/* Card 1: Your Address */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={isCardsInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -8 }}
          className="w-[322px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out hover:shadow-2xl cursor-pointer"
        >
          {/* Top Section - Dark Teal */}
          <div className="w-full h-[230px] bg-[#0F766E] flex items-center justify-center p-6 relative">
            <Image
              src="/bg/What you get/Your address.png"
              alt="Your Address"
              fill
              className="object-contain"
            />
          </div>
          {/* Bottom Section - White */}
          <div className="w-full p-6 bg-white flex-1 flex flex-col">
            <h3 className="text-gray-800 text-xl font-bold mb-3">Your Address</h3>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Your address becomes 6F Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila – to use on your website and business collateral. A great address should improve your SEO rankings.
            </p>
          </div>
        </motion.div>

        {/* Card 2: Local Phone Number */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={isCardsInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          whileHover={{ rotate: 2, scale: 1.05, boxShadow: '0 0 30px rgba(244,164,96,0.5)' }}
          className="w-[322px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out cursor-pointer"
        >
          {/* Top Section - Light Beige/Orange */}
          <div className="w-full h-[230px] bg-[#F4A460] flex items-center justify-center p-6 relative">
            <Image
              src="/bg/What you get/Loclal phone number.png"
              alt="Local Phone Number"
              fill
              className="object-contain"
            />
          </div>
          {/* Bottom Section - White */}
          <div className="w-full p-6 bg-white flex-1 flex flex-col">
            <h3 className="text-gray-800 text-xl font-bold mb-3">Local Phone Number</h3>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Local phone number with dedicated receptionists to answer your calls the way you would like and extend them to you wherever you are.
            </p>
          </div>
        </motion.div>

        {/* Card 3: On-Site Support */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={isCardsInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          whileHover={{ y: -12, scale: 1.05, boxShadow: '0 20px 40px rgba(135,206,235,0.3)' }}
          className="w-[322px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out cursor-pointer"
        >
          {/* Top Section - Light Blue */}
          <div className="w-full h-[230px] bg-[#87CEEB] flex items-center justify-center p-6 relative">
            <Image
              src="/bg/What you get/Support.png"
              alt="On-Site Support"
              fill
              className="object-contain"
            />
          </div>
          {/* Bottom Section - White */}
          <div className="w-full p-6 bg-white flex-1 flex flex-col">
            <h3 className="text-gray-800 text-xl font-bold mb-3">On-Site Support</h3>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Secretaries and in-house IT support team available to assist your business on-site.
            </p>
          </div>
        </motion.div>

        {/* Card 4: Mobile Business Phone */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={isCardsInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
          whileHover={{ scale: 1.1, rotate: -1, boxShadow: '0 0 40px rgba(65,105,225,0.4)' }}
          className="w-[322px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out cursor-pointer"
        >
          {/* Top Section - Bright Blue */}
          <div className="w-full h-[230px] bg-[#4169E1] flex items-center justify-center p-6 relative">
            <Image
              src="/bg/What you get/MObile business.png"
              alt="Mobile Business Phone"
              fill
              className="object-contain"
            />
          </div>
          {/* Bottom Section - White */}
          <div className="w-full p-6 bg-white flex-1 flex flex-col">
            <h3 className="text-gray-800 text-xl font-bold mb-3">Mobile Business Phone</h3>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Take your business phone on your mobile anywhere outside your home location.
            </p>
          </div>
        </motion.div>
      </div>

      {children}
      {/* Diagonal Divider Design at Bottom - Rotated 180 degrees */}
      <div 
        className="w-full bg-[#0F766E] absolute bottom-0"
        style={{
          height: '350px',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 20%, 60% 20%, 40% 150%, 0% 100%)',
          transform: 'translateY(-700px) rotate(180deg)'
        }}
      >
      </div>
    </section>
  );
}
