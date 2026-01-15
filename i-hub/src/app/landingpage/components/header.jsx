'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LoginModal from '@/app/auth/login';
import SignUpModal from '@/app/auth/signIn';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className={`max-w-7xl mx-auto px-4 lg:px-6 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-3.5'}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-all duration-300">
            <Image
              src="/Gemini_Generated_Image_6qx9a16qx9a16qx9.png"
              alt="I-HUB Office Rentals"
              width={isScrolled ? 50 : 76}
              height={isScrolled ? 50 : 76}
              className="h-auto w-auto transition-all duration-300"
              priority
            />
            <span className={`font-semibold text-black transition-all duration-300 ${isScrolled ? 'text-xs' : 'text-sm'}`}>I-HUB</span>
          </Link>

          {/* Desktop Navigation Links - Bold Dark Navy */}
          <nav className={`hidden md:flex items-center transition-all duration-300 ${isScrolled ? 'gap-3' : 'gap-3.5'}`}>
            <button
              onClick={() => setIsSignUpOpen(true)}
              className={`text-slate-800 font-bold hover:text-slate-600 transition-colors ${isScrolled ? 'text-xs' : 'text-sm'}`}
            >
              Sign up
            </button>
            <button
              onClick={() => setIsLoginOpen(true)}
              className={`text-slate-800 font-bold hover:text-slate-600 transition-colors ${isScrolled ? 'text-xs' : 'text-sm'}`}
            >
              Login
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-slate-800 p-2"
            aria-label="Toggle menu"
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
                className="text-slate-800 font-bold hover:text-slate-600 transition-colors text-sm text-left py-2"
              >
                Sign up
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLoginOpen(true);
                }}
                className="text-slate-800 font-bold hover:text-slate-600 transition-colors text-sm text-left py-2"
              >
                Login
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

