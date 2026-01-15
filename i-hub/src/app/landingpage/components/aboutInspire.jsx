'use client';

import { useRef, useState, useEffect } from 'react';
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
  
  // Slideshow images for top-right
  const topRightSlideshowImages = [
    '/images/IMG_5319.jpg',
    '/images/IMG_5315.jpg',
    '/images/IMG_5311.jpg',
    '/images/IMG_5309.jpg',
    '/images/IMG_5302.jpg',
  ];
  
  // Slideshow images for bottom-left
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
    <section id="about-i-hub" ref={sectionRef} className="relative bg-white py-16 lg:py-24 overflow-hidden">
      {/* Top Background - Solid Color */}
      <div 
        className="absolute top-0 left-0 right-0 h-1/2 bg-[#1F2937] pointer-events-none z-0"
      ></div>
      
      {/* 2x2 Grid Layout - Full Width */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0 w-full">
          {/* Top-Left: About Inspire Hub Text Panel */}
          <motion.div
            initial={{ opacity: 0, x: '50%', scale: 0.5 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: '50%', scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            className="bg-[#1F2937] p-8 lg:p-12 flex flex-col justify-center min-h-[300px] lg:min-h-[400px]"
          >
            <h2 className={`${leagueSpartan.className} text-3xl lg:text-4xl font-bold text-white mb-6 text-right`}>
              About Inspire Hub
            </h2>
            <p className={`${roboto.className} text-base lg:text-lg text-white leading-relaxed text-right`}>
              At Inspire Hub, we create environments where productivity meets comfort. Our co-working spaces are designed to empower professionals, entrepreneurs, and businesses to thrive in a collaborative and inspiring atmosphere.
            </p>
          </motion.div>

          {/* Top-Right: Open Co-working Space Slideshow */}
          <motion.div
            initial={{ opacity: 0, x: '-50%', scale: 0.5 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: '-50%', scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative h-[300px] lg:h-[400px] overflow-hidden"
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
            className="relative h-[300px] lg:h-[400px] overflow-hidden"
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
