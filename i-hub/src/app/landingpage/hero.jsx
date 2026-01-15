'use client';

import Image from 'next/image';
import Link from 'next/link';
import { League_Spartan } from 'next/font/google';
import { motion } from 'framer-motion';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['700'], // Bold weight
  variable: '--font-league-spartan',
});

export default function Hero() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Organic Teal Wave Background */}
      <motion.div 
        className="absolute bottom-[3%] left-0 right-0 w-full h-full pointer-events-none"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <svg
          className="absolute bottom-[3%] left-0 w-full h-full"
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
            className="space-y-4 sm:space-y-6 lg:space-y-8 -ml-0 sm:-ml-[5%] lg:-ml-[10%] mt-0 sm:mt-[8%] lg:mt-[15%]"
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
              className="inline-block bg-[#0F766E] hover:bg-[#0d6b64] text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-[20px] transform scale-x-[1.5] sm:scale-x-[1.7] lg:scale-x-[1.9] scale-y-[1.3] sm:scale-y-[1.5] lg:scale-y-[1.7] mt-4 sm:mt-[10%] lg:mt-[15%] ml-0 sm:ml-[5%] lg:ml-[10%] border-[2px] sm:border-[3px] border-white transition-colors duration-200 text-sm sm:text-base"
            >
              Inquire
            </Link>
          </motion.div>

          {/* Right Side - Overlapping Images */}
          <motion.div 
            className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] hidden lg:block"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          >
            {/* Mid Image */}
            <motion.div 
              className="absolute bottom-[15%] left-[12%] w-[362.25px] lg:w-[410.55px] h-[301.875px] lg:h-[338.1px] rounded-2xl overflow-hidden z-[60] border-8 border-white cursor-pointer"
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

        {/* Search Bar - Bottom Center */}
        <div className="mt-8 sm:mt-12 lg:mt-16 xl:mt-24 flex justify-center">
          <div className="relative w-full max-w-full sm:max-w-lg lg:max-w-[44.1rem]">
            <div className="flex items-center bg-[#0F766E] rounded-[20px] sm:rounded-[31.5px] border-[3px] sm:border-[5.25px] border-white overflow-hidden">
              {/* Search Icon */}
              <div className="pl-2 sm:pl-[1.05rem] pr-1 sm:pr-[0.525rem]">
                <svg
                  className="w-4 h-4 sm:w-[1.575rem] sm:h-[1.575rem] text-teal-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              
              {/* Input Field */}
              <input
                type="text"
                placeholder="Search by room, capacity, or location..."
                className="flex-1 px-2 sm:px-[1.05rem] py-2 sm:py-[1.05rem] bg-[#0F766E] text-teal-300 placeholder-teal-300 focus:outline-none rounded-none text-sm sm:text-base"
              />
              
              {/* Search Button */}
              <button className="h-full bg-white hover:bg-gray-100 text-[#0F766E] font-semibold px-3 sm:px-[1.75rem] py-2 sm:py-[1.05rem] rounded-none rounded-r-[20px] sm:rounded-r-[31.5px] transition-colors duration-200 text-sm sm:text-base">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
