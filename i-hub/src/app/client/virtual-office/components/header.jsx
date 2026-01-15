'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

export default function VirtualOfficeHeader() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      // Redirect to landing page after logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to landing page
      router.push('/');
    }
  };

  return (
    <header className="w-full bg-[#0F766E] px-4 sm:px-[1.575rem] py-2 sm:py-[1.05rem] sticky top-0 z-[200]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-[0.7875rem]">
          <div className="relative w-8 h-8 sm:w-[2.75625rem] sm:h-[2.75625rem]">
            <Image
              src="/LOGOS/Gemini_Generated_Image_lf2zu3lf2zu3lf2z.png"
              alt="I-Hub Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-white text-base sm:text-[1.378125rem] font-semibold">Inspire Hub</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-[1.575rem]">
          <Link
            href="/client/home"
            className="text-white text-[0.9646875rem] font-medium hover:text-teal-100 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/client/virtual-office"
            className="text-white text-[0.9646875rem] font-medium hover:text-teal-100 transition-colors"
          >
            Inquire Virtual Office
          </Link>
          <button
            onClick={handleLogout}
            className="text-white text-[0.9646875rem] font-medium cursor-pointer hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white p-2"
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
        <nav className="md:hidden mt-2 pb-4 border-t border-teal-600">
          <div className="flex flex-col gap-3 pt-3">
            <Link
              href="/client/home"
              onClick={() => setIsMenuOpen(false)}
              className="text-white text-sm font-medium hover:text-teal-100 transition-colors px-4 py-2"
            >
              Home
            </Link>
            <Link
              href="/client/virtual-office"
              onClick={() => setIsMenuOpen(false)}
              className="text-white text-sm font-medium hover:text-teal-100 transition-colors px-4 py-2"
            >
              Inquire Virtual Office
            </Link>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="text-white text-sm font-medium hover:text-teal-100 transition-colors px-4 py-2 text-left"
            >
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
