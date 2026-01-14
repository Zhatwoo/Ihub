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
  '/images/IMG_5290.jpg',
  '/images/IMG_5318.jpg',
  '/images/IMG_5330.jpg',
  '/images/IMG_5338.jpg',
];

export default function ClientHomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef(null);
  const carouselRef2 = useRef(null);

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
      image: '/images/IMG_5326.jpg',
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

  const scrollCarousel = (direction, ref = null) => {
    const carousel = ref || carouselRef.current;
    if (!carousel) return;
    
    const cardWidth = 320; // Card width including gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    
    if (direction === 'left') {
      carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const availableSpaces = [
    {
      id: 1,
      title: 'Executive Suite',
      location: 'Silang Junction South',
      image: '/images/IMG_5326.jpg',
      rating: 4.98,
      badge: 'Guest favorite'
    },
    {
      id: 2,
      title: 'Modern Workspace',
      location: 'Tagaytay',
      image: '/images/IMG_5302.jpg',
      rating: 5.0,
      badge: 'Guest favorite'
    },
    {
      id: 3,
      title: 'Business Center',
      location: 'Maitim 2nd East',
      image: '/images/IMG_5271.jpg',
      rating: 4.96,
      badge: 'Guest favorite'
    },
    {
      id: 4,
      title: 'Private Office',
      location: 'Tagaytay',
      image: '/images/IMG_5302.jpg',
      rating: 4.88,
      badge: 'Guest favorite'
    },
    {
      id: 5,
      title: 'Co-working Space',
      location: 'Silang Junction South',
      image: '/images/IMG_5271.jpg',
      rating: 4.99,
      badge: 'Guest favorite'
    },
    {
      id: 6,
      title: 'Professional Office',
      location: 'Tagaytay',
      image: '/images/IMG_5326.jpg',
      rating: 4.81
    },
    {
      id: 7,
      title: 'Premium Workspace',
      location: 'Silang Junction North',
      image: '/images/IMG_5302.jpg',
      rating: 5.0
    }
  ];


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
      <section className="pt-20 pb-8 bg-white">
        <div className="max-w-[90%] mx-auto px-4">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800`}>Private Offices</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Scroll left"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Scroll right"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="flex-shrink-0 w-[300px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group relative"
              >
                <div className="relative h-[200px]">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <div className="p-4 bg-white">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{feature.description}</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* Available Spaces Carousel Section */}
      <section className="pt-8 pb-20 bg-white">
        <div className="max-w-[90%] mx-auto px-4">
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800`}>Available Spaces</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollCarousel('left', carouselRef2.current)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Scroll left"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollCarousel('right', carouselRef2.current)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Scroll right"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              ref={carouselRef2}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
            {availableSpaces.map((space) => (
              <div
                key={space.id}
                className="flex-shrink-0 w-[300px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group relative"
              >
                <div className="relative h-[200px]">
                  <Image
                    src={space.image}
                    alt={space.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <div className="p-4 bg-white">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{space.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">{space.location}</p>
                  {space.badge && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-teal-700 bg-teal-100 rounded-md">
                      {space.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-white">
        <div className="px-4 py-16 mx-auto max-w-[95%] sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="flex flex-col justify-center md:pr-8 xl:pr-0 lg:max-w-lg">
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-teal-100">
                <svg className="text-teal-900 w-7 h-7" viewBox="0 0 24 24">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    points=" 8,5 8,1 16,1 16,5"
                    strokeLinejoin="round"
                  />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    points="9,15 1,15 1,5 23,5 23,15 15,15"
                    strokeLinejoin="round"
                  />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    points="22,18 22,23 2,23 2,18"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="9"
                    y="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    width="6"
                    height="4"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="max-w-xl mb-6">
                <h2 className={`${leagueSpartan.className} max-w-lg mb-6 font-sans text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl sm:leading-none`}>
                  Let us handle
                  <br className="hidden md:block" />
                  your next{' '}
                  <span className="inline-block text-teal-600">
                    destination
                  </span>
                </h2>
                <p className="text-base text-gray-700 md:text-lg">
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
                  quae. explicabo.
                </p>
              </div>
              <div>
                <Link
                  href="/client/private-offices"
                  aria-label="Learn more"
                  className="inline-flex items-center font-semibold transition-colors duration-200 text-teal-600 hover:text-teal-800"
                >
                  Learn more
                  <svg
                    className="inline-block w-3 ml-2"
                    fill="currentColor"
                    viewBox="0 0 12 12"
                  >
                    <path d="M9.707,5.293l-5-5A1,1,0,0,0,3.293,1.707L7.586,6,3.293,10.293a1,1,0,1,0,1.414,1.414l5-5A1,1,0,0,0,9.707,5.293Z" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center -mx-4 lg:pl-8">
              <div className="flex flex-col items-end px-3">
                <div className="relative mb-6 rounded shadow-lg h-28 sm:h-48 xl:h-56 w-28 sm:w-48 xl:w-56 overflow-hidden">
                  <Image
                    src="/images/IMG_5326.jpg"
                    alt="Modern workspace"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="relative w-20 h-20 rounded shadow-lg sm:h-32 xl:h-40 sm:w-32 xl:w-40 overflow-hidden">
                  <Image
                    src="/images/IMG_5325.jpg"
                    alt="Professional office space"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="px-3">
                <div className="relative w-40 h-40 rounded shadow-lg sm:h-64 xl:h-80 sm:w-64 xl:w-80 overflow-hidden">
                  <Image
                    src="/images/IMG_5322.jpg"
                    alt="Collaborative workspace"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
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
