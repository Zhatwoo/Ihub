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
import WhyChooseUs from './components/WhyChooseUs';
import ContentSection from './components/ContentSection';
import CTASection from './components/CTASection';

// ============================================
// MAIN COMPONENT
// ============================================
export default function ClientHomePage() {
  // ============================================
  // EFFECTS & HOOKS
  // ============================================

  // ============================================
  // RENDER
  // ============================================
  return (
    <div>
      <HeroSection />
      <PrivateOfficesSection />
      <DedicatedDeskSection />
      <AmenitiesSection />
      <WhyChooseUs />
      <ContentSection />
      <CTASection />
      <Footer />
    </div>
  );
}
