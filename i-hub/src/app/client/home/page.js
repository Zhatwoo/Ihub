'use client';

// ============================================
// IMPORTS
// ============================================
import { useEffect } from 'react';
import Footer from '@/app/landingpage/components/footer';
import HeroSection from './components/HeroSection';
import PrivateOfficesSection from './components/PrivateOfficesSection';
import DedicatedDeskSection from './components/DedicatedDeskSection';
import AmenitiesSection from './components/AmenitiesSection';
import ContentSection from './components/ContentSection';
import CTASection from './components/CTASection';

// ============================================
// MAIN COMPONENT
// ============================================
export default function ClientHomePage() {
  // ============================================
  // EFFECTS & HOOKS
  // ============================================
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

  // ============================================
  // RENDER
  // ============================================
  return (
    <div>
      <HeroSection />
      <PrivateOfficesSection />
      <DedicatedDeskSection />
      <AmenitiesSection />
      <ContentSection />
      <CTASection />
      <Footer />
    </div>
  );
}
