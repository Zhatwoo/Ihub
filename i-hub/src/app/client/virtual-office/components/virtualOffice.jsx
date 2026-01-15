'use client';

import { League_Spartan } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function VirtualOfficeHero() {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const backgroundRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const isTextInView = useInView(textRef, { once: true, amount: 0.2 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="w-full bg-white min-h-[1080px] overflow-visible">
      {/* Diagonal Divider Design at Top */}
      <motion.div 
        ref={heroRef}
        className="w-full bg-[#0F766E] relative overflow-hidden"
        style={{
          height: '500px',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 5%, 60% 5%, 40% 150%, 0% 100%)',
          background: '#0F766E'
        }}
      >

        {/* Green Rectangle with Text */}
        <div className="absolute left-[8%] top-[7%] sm:left-[8%] sm:top-[7%]">
          <div className=" bg-transparent p-8 sm:p-10 lg:p-12">
            <motion.h1 
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={isHeroInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -50, scale: 0.9 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`text-white text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 ${leagueSpartan.className}`}
            >
              Virtual Office
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className={`text-white text-2xl sm:text-3xl lg:text-4xl leading-relaxed text-center ${leagueSpartan.className}`}
            >
              Professional business address and <br/> support services for your growing <br/> enterprise
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHeroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
              className="flex justify-center mt-6 sm:mt-8"
            >
              <Link
                href="#inquiry-form"
                className={`bg-white text-[#0F766E] px-8 py-3 sm:px-10 sm:py-4 lg:px-12 lg:py-5 rounded-lg font-semibold text-lg sm:text-xl lg:text-2xl hover:bg-teal-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 ${leagueSpartan.className}`}
              >
                Inquire
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* White Section with Green Rectangle Box and Text */}
      <motion.div 
        ref={backgroundRef}
        className="w-full bg-white relative min-h-[600px] overflow-visible"
        style={{
          background: '#FFFFFF',
        }}
      >
        {/* Green Rectangle Box with Image */}
        <div className="absolute right-[30%] top-0 sm:right-[30%] sm:top-0 lg:right-[30%] lg:top-0 z-[100]" style={{ transform: 'translateY(-100%)' }}>
          <div className="bg-transparent p-8 sm:p-10 lg:p-12 w-96 h-72 sm:w-[480px] sm:h-[336px] lg:w-[576px] lg:h-96 relative z-[100]">
            <Image
              src="/bg/image.png"
              alt="Virtual Office"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Second Image to the Right */}
        <div className="absolute right-[calc(5%-8%+5%)] top-0 sm:right-[calc(5%-8%+5%)] sm:top-0 lg:right-[calc(5%-8%+5%)] lg:top-0 z-[101]" style={{ transform: 'translateY(-70%)' }}>
          <div className="bg-transparent p-8 sm:p-10 lg:p-12 w-96 h-72 sm:w-[480px] sm:h-[336px] lg:w-[576px] lg:h-96 relative z-[101]">
            <Image
              src="/bg/image1.png"
              alt="Virtual Office"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Third Image Below Second Image */}
        <div className="absolute right-[calc(5%-8%+15%)] top-0 sm:right-[calc(5%-8%+15%)] sm:top-0 lg:right-[calc(5%-8%+15%)] lg:top-0 z-[102]" style={{ transform: 'translateY(calc(40% + 100% - 450px))' }}>
          <div className="bg-transparent p-8 sm:p-10 lg:p-12 w-96 h-72 sm:w-[480px] sm:h-[336px] lg:w-[576px] lg:h-96 relative z-[102]">
            <Image
              src="/bg/Image2.png"
              alt="Virtual Office"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Text in White Background */}
        <div ref={textRef} className="absolute left-[10%] top-8 sm:left-[10%] sm:top-12 lg:left-[10%] lg:top-16 z-20">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isTextInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-[63rem] bg-white backdrop-blur-sm p-6 rounded-lg"
          >
            <motion.p 
              initial={{ opacity: 0 }}
              animate={isTextInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`text-gray-800 text-[1.294rem] sm:text-[1.438rem] lg:text-[1.725rem] leading-relaxed text-left font-bold ${leagueSpartan.className}`}
            >
              I-Hub's Virtual Office solutions equip your business with the essential tools to thrive. Establish a strong presence with a prestigious 5-star business address, a local phone number, dedicated receptionist services, and comprehensive corporate registration support.
              <br/><br/>
              With an I-Hub Virtual Office, you can project the image and enjoy the operational support of a well-established global company—quickly, seamlessly, and at a fraction of the traditional cost.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
