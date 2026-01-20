'use client';

// ============================================
// IMPORTS
// ============================================
import { useEffect } from 'react';
import Footer from '@/app/landingpage/components/footer.jsx';
import HeroSection from './components/HeroSection.jsx';
import PrivateOfficesSection from './components/PrivateOfficesSection.jsx';
import DedicatedDeskSection from './components/DedicatedDeskSection.jsx';
import AmenitiesSection from './components/AmenitiesSection.jsx';
import WhyChooseUs from './components/WhyChooseUs.jsx';
import ContentSection from './components/ContentSection.jsx';
import CTASection from './components/CTASection.jsx';

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
