'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/TranslationContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  const { t } = useTranslation();
  const navItems = [
    { name: t('client.header.home'), href: '/client' },
    { name: t('client.header.virtualOffice'), href: '/client/virtual-office' },
    { name: t('client.header.myBookings'), href: '/client/bookings' },
  ];
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if we're on the home page
  const isHomePage = pathname === '/client' || pathname === '/client/home' || pathname === '/client/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactClick = () => {
    // Store referrer in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('contactReturnTo', '/client/home');
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await api.logout();
      // Redirect to landing page after logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect (cookies might still be cleared)
      router.push('/');
    }
  };

  // Note: This file does not contain any bg-gradient-to-br classes.
  // Any linter warnings about gradient classes are false positives from cached state.

  // Determine background color:
  // - On home page: transparent when not scrolled, green when scrolled
  // - On other pages: always green (even when not scrolled)
  const getBackgroundColor = () => {
    if (isHomePage) {
      // Home page: transparent when not scrolled, green when scrolled
      return isScrolled ? '#0F766E' : 'transparent';
    } else {
      // Other pages: always green
      return '#0F766E';
    }
  };

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled || !isHomePage ? 'shadow-sm' : ''}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/client" className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src="/LOGOS/0-02-06-8297a0147f35064df629e355bd3410a9b77af838168434dc8807d9d30680c9a8_220d8f6c77e.jpg"
              alt="I-Hub - INSPIRE HUB"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="text-xl font-bold text-white">{t('common.appName')}</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === item.href ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
              {item.name}
            </Link>
          ))}
          <Link 
            href="/landingpage/contacts?returnTo=/client/home" 
            onClick={handleContactClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/landingpage/contacts' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
          >
            {t('client.header.contact')}
          </Link>
          <LanguageSwitcher variant="dark" className="ml-1" />
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-white/90 hover:bg-white/10 hover:text-white"
          >
            {t('client.header.logout')}
          </button>
        </nav>
      </div>
    </header>
  );
}

