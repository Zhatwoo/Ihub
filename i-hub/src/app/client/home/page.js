'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const heroImages = [
  '/images/desk2.png',
  '/images/desk1.1.png',
  '/images/desk1.png',
  '/images/Corporate 1.jpg',
];

export default function ClientHomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Make navbar transparent and handle scroll
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 50) {
        header.classList.remove('bg-transparent', 'shadow-none', 'border-none');
        header.classList.add('bg-white', 'shadow-sm');
        // Update text colors
        const logoText = header.querySelector('span');
        const navLinks = header.querySelectorAll('nav a');
        if (logoText) logoText.classList.remove('text-white', 'drop-shadow-lg');
        if (logoText) logoText.classList.add('text-slate-800');
        navLinks.forEach(link => {
          link.classList.remove('text-white', 'text-white/95', 'hover:text-white', 'bg-white/25', 'backdrop-blur-md', 'border-white/30', 'hover:bg-white/15', 'hover:border-white/20');
        });
      } else {
        header.classList.remove('bg-white', 'shadow-sm');
        header.classList.add('bg-transparent', 'shadow-none', 'border-none');
        // Update text colors to white
        const logoText = header.querySelector('span');
        const navLinks = header.querySelectorAll('nav a');
        if (logoText) {
          logoText.classList.remove('text-slate-800');
          logoText.classList.add('text-white', 'drop-shadow-lg');
        }
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === '/client' || link.getAttribute('href') === '/client/home';
          if (isActive) {
            link.classList.add('bg-white/25', 'text-white', 'backdrop-blur-md');
          } else {
            link.classList.add('text-white/95', 'hover:text-white', 'hover:bg-white/15');
          }
          link.classList.remove('bg-teal-50', 'text-teal-700', 'text-gray-600', 'hover:bg-gray-100', 'hover:text-slate-800', 'border', 'border-white/30', 'border-transparent', 'hover:border-white/20');
        });
      }
    };

    // Set initial transparent state
    header.classList.add('bg-transparent', 'shadow-none', 'border-none');
    const logoText = header.querySelector('span');
    const navLinks = header.querySelectorAll('nav a');
    if (logoText) {
      logoText.classList.add('text-white', 'drop-shadow-lg');
    }
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '/client' || link.getAttribute('href') === '/client/home';
      if (isActive) {
        link.classList.add('bg-white/25', 'text-white', 'backdrop-blur-md', 'border', 'border-white/30');
      } else {
        link.classList.add('text-white/95', 'hover:text-white', 'hover:bg-white/15', 'border-transparent', 'hover:border-white/20');
      }
      link.classList.remove('bg-teal-50', 'text-teal-700', 'text-gray-600', 'hover:bg-gray-100', 'hover:text-slate-800');
    });

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Cleanup: restore original styles when component unmounts
        header.classList.remove('bg-transparent', 'shadow-none', 'border-none');
        header.classList.add('bg-white', 'shadow-sm');
    };
  }, []);

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
    <div>
      {/* Hero Section */}
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
                alt={`Modern conference room ${index + 1} at Inspire Hub`}
                fill
                className="object-cover"
                priority={index === 0}
                unoptimized
              />
            </div>
          ))}
        </div>
        
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 to-slate-800/60"></div>
        
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
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">Find Your Perfect Meeting Space</h1>
            <p className="text-xl lg:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto drop-shadow-md">Book premium private offices and event spaces at Inspire Hub. Professional environments for your business needs.</p>
            <Link href="/client/private-offices" className="inline-block px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-teal-600/30 hover:-translate-y-1 hover:shadow-xl transition-all">
              Browse Private Offices
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">Why Choose Inspire Hub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-slate-50">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🏢</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Premium Spaces</h3>
              <p className="text-gray-600">Modern, well-equipped private offices designed for productivity and comfort.</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-slate-50">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📅</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Easy Booking</h3>
              <p className="text-gray-600">Simple online reservation system. Book your space in just a few clicks.</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-slate-50">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">✨</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Full Amenities</h3>
              <p className="text-gray-600">High-speed WiFi, projectors, whiteboards, and catering options available.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-teal-600">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Book Your Space?</h2>
          <p className="text-teal-100 mb-8">Get started today and find the perfect room for your next meeting or event.</p>
          <Link href="/client/private-offices" className="inline-block px-8 py-4 bg-white text-teal-700 rounded-xl font-semibold shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all">
            View Available Offices
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center text-lg">🏢</div>
            <span className="text-lg font-bold text-white">Inspire Hub</span>
          </div>
          <p className="text-sm">© 2026 Inspire Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

