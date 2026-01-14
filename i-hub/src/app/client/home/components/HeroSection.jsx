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

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  return (
    <section className="relative h-[600px] overflow-hidden -mt-[80px] pt-[80px]">
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 to-slate-800/50"></div>
      
      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
        aria-label="Previous image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
        aria-label="Next image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
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
          <Link href="/client/private-offices" className="inline-block px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-teal-600/30 hover:-translate-y-1 hover:shadow-xl transition-all">
            Inquire
          </Link>
        </div>
      </div>
    </section>
  );
}

