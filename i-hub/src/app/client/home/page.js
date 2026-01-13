'use client';

import { useState, useEffect, useRef } from 'react';
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
];

export default function ClientHomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef(null);

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

  const whyChooseFeatures = [
    {
      id: 1,
      title: 'Premium Spaces',
      description: 'Modern, well-equipped private offices designed for productivity and comfort.',
      image: '/images/IMG_5271.jpg',
      rating: 4.95,
      badge: 'Guest favorite'
    },
    {
      id: 2,
      title: 'Easy Booking',
      description: 'Simple online reservation system. Book your space in just a few clicks.',
      image: '/images/IMG_5302.jpg',
      rating: 4.91,
      badge: 'Guest favorite'
    },
    {
      id: 3,
      title: 'Full Amenities',
      description: 'High-speed WiFi, projectors, whiteboards, and catering options available.',
      image: '/images/IMG_5271.jpg',
      rating: 4.95,
      badge: 'Guest favorite'
    },
    {
      id: 4,
      title: 'Prime Location',
      description: 'Strategically located in the heart of the city with easy access to transportation.',
      image: '/images/IMG_5302.jpg',
      rating: 4.98,
      badge: 'Guest favorite'
    },
    {
      id: 5,
      title: 'Secure & Safe',
      description: '24/7 security monitoring and secure access systems to ensure your peace of mind.',
      image: '/images/IMG_5271.jpg',
      rating: 4.92,
      badge: 'Guest favorite'
    },
    {
      id: 6,
      title: 'Professional Support',
      description: 'Dedicated customer service team ready to assist you with all your workspace needs.',
      image: '/images/IMG_5302.jpg',
      rating: 4.95,
      badge: 'Guest favorite'
    },
    {
      id: 7,
      title: 'Flexible Options',
      description: 'Choose from hourly, daily, or monthly rental options that fit your schedule.',
      image: '/images/IMG_5271.jpg',
      rating: 4.94,
      badge: 'Guest favorite'
    }
  ];

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    
    const cardWidth = 320; // Card width including gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    
    if (direction === 'left') {
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 to-slate-800/30"></div>
        
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

      {/* Why Choose Inspire Hub - Carousel Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800`}>Why Choose Inspire Hub?</h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="Scroll left"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                aria-label="Scroll right"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {whyChooseFeatures.map((feature) => (
              <div
                key={feature.id}
                className="flex-shrink-0 w-[300px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <div className="relative h-[200px]">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-800 px-3 py-1 rounded-full">
                      {feature.badge}
                    </span>
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 bg-white">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{feature.description}</p>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-teal-600 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-800">{feature.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* Content Section */}
      <section className="px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20 bg-white">
        <div className="max-w-xl mb-10 md:mx-auto sm:text-center lg:max-w-2xl md:mb-12">
          <div>
            <p className="inline-block px-3 py-px mb-4 text-xs font-semibold tracking-wider text-teal-900 uppercase rounded-full bg-teal-100">
              Brand new
            </p>
          </div>
          <h2 className={`${leagueSpartan.className} max-w-lg mb-6 text-3xl font-bold leading-none tracking-tight text-gray-900 sm:text-4xl md:mx-auto`}>
            <span className="relative inline-block">
              <svg
                viewBox="0 0 52 24"
                fill="currentColor"
                className="absolute top-0 left-0 z-0 hidden w-32 -mt-8 -ml-20 text-teal-100 lg:w-32 lg:-ml-28 lg:-mt-10 sm:block"
              >
                <defs>
                  <pattern
                    id="2feffae2-9edf-414e-ab8c-f0e6396a0fc1"
                    x="0"
                    y="0"
                    width=".135"
                    height=".30"
                  >
                    <circle cx="1" cy="1" r=".7" />
                  </pattern>
                </defs>
                <rect
                  fill="url(#2feffae2-9edf-414e-ab8c-f0e6396a0fc1)"
                  width="52"
                  height="24"
                />
              </svg>
              <span className="relative">The</span>
            </span>{' '}
            perfect workspace solution for your business
          </h2>
          <p className="text-base text-gray-700 md:text-lg">
            Experience modern, flexible workspaces designed to inspire productivity and collaboration. 
            Join a community of professionals at Inspire Hub.
          </p>
        </div>
        <div className="grid max-w-screen-lg gap-8 lg:grid-cols-2 sm:mx-auto">
          <div className="grid grid-cols-2 gap-5">
            <div className="relative w-full h-56 col-span-2 rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/images/IMG_5271.jpg"
                alt="Modern workspace at Inspire Hub"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="relative w-full h-48 rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/images/IMG_5302.jpg"
                alt="Professional office space"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="relative w-full h-48 rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/images/IMG_5271.jpg"
                alt="Collaborative workspace"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="pb-4 mb-4 border-b">
              <h6 className={`${leagueSpartan.className} mb-2 font-semibold leading-5 text-slate-800`}>
                Premium workspace amenities
              </h6>
              <p className="text-sm text-gray-900">
                High-speed internet, modern meeting rooms, and state-of-the-art facilities 
                designed to enhance your productivity and professional image.
              </p>
            </div>
            <div className="pb-4 mb-4 border-b">
              <h6 className={`${leagueSpartan.className} mb-2 font-semibold leading-5 text-slate-800`}>
                Flexible rental options
              </h6>
              <p className="text-sm text-gray-900">
                Choose from hourly, daily, or monthly plans that adapt to your business needs. 
                No long-term commitments required.
              </p>
            </div>
            <div>
              <h6 className={`${leagueSpartan.className} mb-2 font-semibold leading-5 text-slate-800`}>
                Prime location in the heart of the city
              </h6>
              <p className="text-sm text-gray-900">
                Strategically located with easy access to transportation, dining, and business districts. 
                Make a great impression with our prestigious address.
              </p>
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
