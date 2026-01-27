'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { League_Spartan } from 'next/font/google';
import { motion, useInView } from 'framer-motion';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['700'], // Bold weight
  variable: '--font-league-spartan',
});

// Counting animation component
function CountUp({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Hero() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden pt-[104px]">
      {/* Organic Teal Wave Background */}
      <motion.div 
        className="absolute bottom-[-25%] left-0 right-0 w-full h-full pointer-events-none"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <svg
          className="absolute bottom-[15%] left-0 w-full h-full"
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,525 L600,525 C600,525 600,525 100,525 C200,525 400,500 600,400 C800,300 1000,138 1200,138 C1300,138 1380,140 1440,150 L1440,800 L0,800 Z"
            fill="#0F766E"
          />
        </svg>
      </motion.div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-[12.8px] pb-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
          {/* Left Side - Text Content */}
          <motion.div 
            className="space-y-4 sm:space-y-6 lg:space-y-8 ml-0 sm:-ml-[5%] lg:-ml-[10%] mt-0 sm:mt-[8%] lg:mt-[15%] 2xl:mt-[25%]"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          >
            <h1 className={`${leagueSpartan.className} text-4xl sm:text-5xl md:text-6xl lg:text-[91.08px] xl:text-[113.85px] font-bold text-slate-800 leading-[0.85]`}>
              Welcome to <br/> Inspire Hub
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-[20.7px] xl:text-[23px] text-slate-700 leading-relaxed max-w-lg">
              The community, workspaces, and technology to make a good impression and get down to business.
            </p>
            <Link 
              href="/landingpage/contacts" 
              className="inline-block bg-[#0F766E] hover:bg-[#0d6b64] text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-lg border-2 border-white transition-colors duration-200 text-sm sm:text-base"
            >
              Inquire
            </Link>
          </motion.div>

          {/* Right Side - Overlapping Images */}
          <motion.div 
            className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] hidden lg:block 2xl:mt-[10%]"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          >
            {/* Mid Image */}
            <motion.div 
              className="absolute bottom-[15%] left-[12%] w-[362.25px] lg:w-[410.55px] h-[301.875px] lg:h-[338.1px] rounded-2xl overflow-hidden z-60 border-8 border-white cursor-pointer"
              whileHover={{ y: -20, zIndex: 100, scale: 1.05 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/desk2.png"
                  alt="Modern office workspace"
                  fill
                  className="object-cover object-center"
                  style={{ objectPosition: 'center 60%' }}
                  priority
                  sizes="(max-width: 1024px) 362px, 411px"
                />
              </div>
            </motion.div>

            {/* Top Image */}
            <motion.div 
              className="absolute top-[5%] right-[-27%] w-[362.25px] lg:w-[410.55px] h-[301.875px] lg:h-[338.1px] rounded-2xl overflow-hidden z-30 border-8 border-[#0F766E] cursor-pointer"
              whileHover={{ y: -20, zIndex: 100, scale: 1.05 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/Virtual (1).png"
                  alt="Virtual office space"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 362px, 411px"
                />
              </div>
            </motion.div>

            {/* Bottom Image */}
            <motion.div 
              className="absolute bottom-[5%] right-[-37%] w-[362.25px] lg:w-[410.55px] h-[301.875px] lg:h-[338.1px] rounded-2xl overflow-hidden z-50 border-8 border-white cursor-pointer"
              whileHover={{ y: -20, zIndex: 100, scale: 1.05 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/Dedicated.png"
                  alt="Dedicated workspace"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 362px, 411px"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div 
          className="relative z-10 mt-8 sm:mt-12 lg:mt-16 2xl:mt-[15%] 2xl:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto px-4 sm:px-6">
            {/* Stat 1 */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2">
                <CountUp end={500} duration={2000} suffix="+" />
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-white font-medium">
                Workspaces
              </div>
            </div>

            {/* Stat 2 */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2">
                <CountUp end={1000} duration={2000} suffix="+" />
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-white font-medium">
                Members
              </div>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2">
                <CountUp end={50} duration={2000} suffix="+" />
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-white font-medium">
                Locations
              </div>
            </div>

            {/* Stat 4 */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2">
                <CountUp end={98} duration={2000} suffix="%" />
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-white font-medium">
                Satisfaction
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
