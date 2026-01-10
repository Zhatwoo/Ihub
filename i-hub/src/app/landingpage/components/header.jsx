'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

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

          {/* Navigation Links - Bold Dark Navy */}
          <nav className={`flex items-center transition-all duration-300 ${isScrolled ? 'gap-3' : 'gap-3.5'}`}>
            <Link
              href="/signup"
              className={`text-slate-800 font-bold hover:text-slate-600 transition-colors ${isScrolled ? 'text-xs' : 'text-sm'}`}
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className={`text-slate-800 font-bold hover:text-slate-600 transition-colors ${isScrolled ? 'text-xs' : 'text-sm'}`}
            >
              Login
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

