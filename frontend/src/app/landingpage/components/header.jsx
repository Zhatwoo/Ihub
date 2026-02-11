'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LoginModal from '@/app/auth/login';
import SignUpModal from '@/app/auth/signIn';
import { useTranslation } from '@/lib/TranslationContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          // Only update if scroll position changed significantly to prevent unnecessary re-renders
          if (Math.abs(scrollPosition - lastScrollY) > 5) {
            setIsScrolled(scrollPosition > 50);
            lastScrollY = scrollPosition;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Set initial state
    setIsScrolled(window.scrollY > 50);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white will-change-[box-shadow] transition-shadow duration-300 ease-out ${isScrolled ? 'shadow-md' : 'shadow-none'}`} style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
      <div className={`max-w-7xl mx-auto px-4 lg:px-6 transition-[padding] duration-300 ease-out ${isScrolled ? 'py-2' : 'py-3.5'}`} style={{ transform: 'translateZ(0)' }}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className={`rounded-full overflow-hidden flex-shrink-0 transition-[width,height] duration-300 ease-out ${isScrolled ? 'w-[50px] h-[50px]' : 'w-[76px] h-[76px]'}`}>
              <Image
                src="/LOGOS/0-02-06-8297a0147f35064df629e355bd3410a9b77af838168434dc8807d9d30680c9a8_220d8f6c77e.jpg"
                alt="I-Hub - INSPIRE HUB"
                width={76}
                height={76}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <span className={`font-semibold text-black transition-[font-size] duration-300 ease-out ${isScrolled ? 'text-xs' : 'text-sm'}`}>I-HUB</span>
          </Link>

          {/* Desktop Navigation Links - Bold Dark Navy */}
          <nav className={`hidden md:flex items-center gap-6`}>
            <LanguageSwitcher variant="light" />
            <button
              onClick={() => setIsSignUpOpen(true)}
              className="px-4 py-2 bg-[#0F766E] border-2 border-[#0F766E] text-white font-bold hover:bg-[#0d6b64] hover:border-[#0d6b64] transition-colors duration-200 rounded-lg text-sm"
            >
              {t('landing.header.signUp')}
            </button>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-4 py-2 bg-[#0F766E] border-2 border-[#0F766E] text-white font-bold hover:bg-[#0d6b64] hover:border-[#0d6b64] transition-colors duration-200 rounded-lg text-sm"
            >
              {t('landing.header.login')}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-slate-800 p-2"
            aria-label={t('landing.header.toggleMenu')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-slate-200">
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSignUpOpen(true);
                }}
                className="px-4 py-2 bg-[#0F766E] border-2 border-[#0F766E] text-white font-bold hover:bg-[#0d6b64] hover:border-[#0d6b64] transition-all duration-200 rounded-lg text-sm text-center"
              >
                {t('landing.header.signUp')}
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLoginOpen(true);
                }}
                className="px-4 py-2 bg-[#0F766E] border-2 border-[#0F766E] text-white font-bold hover:bg-[#0d6b64] hover:border-[#0d6b64] transition-all duration-200 rounded-lg text-sm text-center"
              >
                {t('landing.header.login')}
              </button>
            </div>
          </nav>
        )}
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignUp={() => setIsSignUpOpen(true)}
      />
      
      {/* Sign Up Modal */}
      <SignUpModal 
        isOpen={isSignUpOpen} 
        onClose={() => setIsSignUpOpen(false)}
        onSwitchToLogin={() => setIsLoginOpen(true)}
      />
    </header>
  );
}

