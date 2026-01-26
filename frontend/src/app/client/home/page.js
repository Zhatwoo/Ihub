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
import CTASection from './components/CTASection';

// ============================================
// MAIN COMPONENT
// ============================================
export default function ClientHomePage() {
  // ============================================
  // EFFECTS & HOOKS
  // ============================================
  
  // Clean up old localStorage token and cache data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Remove old token storage from localStorage (now using cookies)
    const oldTokenKeys = ['idToken', 'refreshToken', 'user'];
    oldTokenKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove old admin cache and admin info from localStorage (now using cookies)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('adminAuth_') || key.startsWith('adminInfo_'))) {
        localStorage.removeItem(key);
      }
    }
    
    // Remove other app-related localStorage data
    const keysToRemove = [
      'calendar-tasks', 'kanban-columns', 'reports-data', 'currentCompanyId',
      'userLocationInfo', 'scheduleStart', 'scheduleEnd', 'siteVisitCount',
      'systemStyle', 'wallpaper', 'weather_cloud_pos', 'websdk_ng_cache_parameter',
      'websdk_ng_global_parameter', 'websdk_ng_install_id', 'informationReadFilter',
      'isDockMode', 'shownToastIds', 'advertisementVideoUrl', 'auth_migration_v1_completed'
    ];
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
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
      <WhyChooseUs />
      <CTASection />
      <Footer />
    </div>
  );
}
