'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { League_Spartan, Roboto } from 'next/font/google';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from '@/lib/TranslationContext';

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
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  
  // Slideshow images for top-right (original + DESK mixed)
  const topRightSlideshowImages = [
    '/images/IMG_5319.jpg',
    '/images/DESK/part1/IMG_1112.JPG',
    '/images/IMG_5315.jpg',
    '/images/DESK/part2/IMG_1120.JPG',
    '/images/IMG_5311.jpg',
    '/images/DESK/part5/IMG_1134.JPG',
    '/images/IMG_5309.jpg',
    '/images/IMG_5302.jpg',
  ];
  
  // Slideshow images for bottom-left (Complimentary Amenities - original only)
  const bottomLeftSlideshowImages = [
    '/images/IMG_5340.jpg',
    '/images/IMG_5337.jpg',
    '/images/IMG_5335.jpg',
    '/images/IMG_5332.jpg',
    '/images/IMG_5331.jpg',
  ];
  
  const [topRightImageIndex, setTopRightImageIndex] = useState(0);
  const [bottomLeftImageIndex, setBottomLeftImageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTopRightImageIndex((prevIndex) => (prevIndex + 1) % topRightSlideshowImages.length);
    }, 3000); // Change image every 3 seconds
    
    return () => clearInterval(interval);
  }, [topRightSlideshowImages.length]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBottomLeftImageIndex((prevIndex) => (prevIndex + 1) % bottomLeftSlideshowImages.length);
    }, 3000); // Change image every 3 seconds
    
    return () => clearInterval(interval);
  }, [bottomLeftSlideshowImages.length]);

  return (
    <section id="about-i-hub" ref={sectionRef} className="relative bg-[#1F2937] py-0 overflow-hidden">
      {/* 2x2 Grid Layout - Full Width */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0 w-full">
          {/* Top-Left: About Inspire Hub Text Panel */}
          <motion.div
            initial={{ opacity: 0, x: '50%', scale: 0.5 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: '50%', scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            className="bg-[#1F2937] p-6 sm:p-8 lg:p-12 flex flex-col justify-center min-h-[250px] sm:min-h-[300px] lg:min-h-[400px]"
          >
            <h2 className={`${leagueSpartan.className} text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 text-left sm:text-right`}>
              {t('landing.aboutInspire.aboutTitle')}
            </h2>
            <p className={`${roboto.className} text-sm sm:text-base lg:text-lg text-white leading-relaxed text-left sm:text-right`}>
              {t('landing.aboutInspire.aboutBody')}
            </p>
          </motion.div>

          {/* Top-Right: Open Co-working Space Slideshow */}
          <motion.div
            initial={{ opacity: 0, x: '-50%', scale: 0.5 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: '-50%', scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative h-[250px] sm:h-[300px] lg:h-[400px] overflow-hidden"
          >
            {topRightSlideshowImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: index === topRightImageIndex ? 1 : 0,
                  scale: index === topRightImageIndex ? 1 : 1.1,
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <Image
                  src={image}
                  alt={`Office workspace ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom-Left: Complimentary Amenities Slideshow */}
          <motion.div
            initial={{ opacity: 0, x: '50%', scale: 0.5 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: '50%', scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="relative h-[250px] sm:h-[300px] lg:h-[400px] overflow-hidden"
          >
            {bottomLeftSlideshowImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: index === bottomLeftImageIndex ? 1 : 0,
                  scale: index === bottomLeftImageIndex ? 1 : 1.1,
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <Image
                  src={image}
                  alt={`Complimentary amenities ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom-Right: Complimentary Amenities Text Panel */}
          <motion.div
            initial={{ opacity: 0, x: '-50%', scale: 0.5 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: '-50%', scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            className="bg-[#1F2937] p-6 sm:p-8 lg:p-12 flex flex-col justify-center min-h-[250px] sm:min-h-[300px] lg:min-h-[400px]"
          >
            <h2 className={`${leagueSpartan.className} text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6`}>
              {t('landing.aboutInspire.amenitiesTitle')}
            </h2>
            <p className={`${roboto.className} text-sm sm:text-base lg:text-lg text-white leading-relaxed`}>
              {t('landing.aboutInspire.amenitiesBody')}
            </p>
          </motion.div>
        </div>
    </section>
  );
}
