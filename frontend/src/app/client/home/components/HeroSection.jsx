'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { League_Spartan } from 'next/font/google';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

const heroImages = [
  '/images/IMG_5271.jpg',
  '/images/IMG_5302.jpg',
  '/images/IMG_5290.jpg',
  '/images/IMG_5318.jpg',
  '/images/IMG_5330.jpg',
  '/images/IMG_5338.jpg',
];

export default function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[600px] overflow-hidden -mt-[80px] pt-[80px] rounded-b-[30px]">
      {/* Full-Width Background Image Carousel */}
      <div className="absolute inset-0 w-full h-full">
        {heroImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={src}
              alt={`Modern workspace ${index + 1} at Inspire Hub`}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />
          </div>
        ))}
      </div>
      
      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-900/70 to-slate-800/50"></div>
      
      {/* Image Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentImageIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Text Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center justify-center">
        <div className="text-center text-white py-12">
          <h1 className={`${leagueSpartan.className} text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg`}>Find Your Perfect Meeting Space</h1>
          <p className="text-xl lg:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto drop-shadow-md">Book premium private offices and event spaces at Inspire Hub. Professional environments for your business needs.</p>
          <Link 
            href="/client/private-offices" 
            className="group relative inline-block px-8 py-4 text-white font-semibold text-lg rounded-md min-w-[120px] cursor-pointer overflow-hidden bg-[linear-gradient(325deg,#0d5c56_0%,#14a89a_55%,#0d5c56_90%)] bg-[length:280%_auto] bg-[position:initial] shadow-[0px_0px_20px_rgba(15,118,110,0.5),0px_5px_5px_-1px_rgba(13,92,86,0.25),inset_4px_4px_8px_rgba(20,168,154,0.5),inset_-4px_-4px_8px_rgba(10,70,66,0.35)] hover:bg-[position:right_top] active:scale-95 transition-all duration-700 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-700"
          >
            Inquire
            <span className="absolute top-0 left-[-75%] w-[200%] h-full bg-white/30 skew-x-[-20deg] opacity-0 group-hover:opacity-100 group-hover:left-[100%] transition-all duration-500 pointer-events-none z-10" />
          </Link>
        </div>
      </div>
    </section>
  );
}

