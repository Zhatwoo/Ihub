'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Home', href: '/client' },
  { name: 'Private Offices', href: '/client/private-offices' },
  { name: 'Dedicated Desk', href: '/client/dedicated-desk' },
  { name: 'Virtual Office', href: '/client/virtual-office' },
  { name: 'My Bookings', href: '/client/bookings' },
  { name: 'Contact', href: '/client/contact' },
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/client' || pathname === '/client/home';
  const isVirtualOffice = pathname === '/client/virtual-office';

  // Ensure navbar is transparent when on home page
  useEffect(() => {
    const applyTransparentNavbar = () => {
      if (isHomePage) {
        const header = document.querySelector('header');
        if (header) {
          // Force transparent styling on home page - remove all white background classes
          header.classList.remove('bg-white', 'shadow-sm', 'border-b', 'border-gray-200');
          header.classList.add('bg-transparent', 'shadow-none', 'border-none');
          
          // Force white text styling
          const logoText = header.querySelector('span');
          if (logoText) {
            logoText.classList.remove('text-slate-800');
            logoText.classList.add('text-white', 'drop-shadow-lg');
          }
          
          // Force white navigation links
          const navLinks = header.querySelectorAll('nav a');
          navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            const isActive = linkHref === '/client' || linkHref === '/client/home';
            
            // Remove all non-transparent styles
            link.classList.remove(
              'bg-teal-50', 'text-teal-700', 'text-gray-600', 
              'hover:bg-gray-100', 'hover:text-slate-800',
              'bg-gradient-to-r', 'from-teal-500', 'to-teal-600', 
              'shadow-lg', 'shadow-teal-500/25', 'border-teal-400/30',
              'hover:from-slate-100', 'hover:to-slate-50', 'hover:text-slate-900',
              'hover:shadow-slate-200/50', 'hover:border-slate-200'
            );
            
            // Add transparent styles
            if (isActive) {
              link.classList.add('bg-white/25', 'text-white', 'backdrop-blur-md', 'border', 'border-white/30', 'shadow-lg', 'shadow-black/10');
            } else {
              link.classList.add('text-white/95', 'hover:text-white', 'hover:bg-white/15', 'border-transparent', 'hover:border-white/20', 'hover:backdrop-blur-sm', 'hover:shadow-md', 'hover:shadow-black/5');
            }
          });
        }
      }
    };

    // Apply immediately
    applyTransparentNavbar();
    
    // Also apply after a small delay to ensure it overrides any other styles
    const timeout = setTimeout(applyTransparentNavbar, 100);
    
    return () => clearTimeout(timeout);
  }, [pathname, isHomePage]);

  return (
    <div className="min-h-screen bg-slate-50">
      {!isVirtualOffice && (
        <header className={`sticky top-0 z-40 transition-all duration-300 ${
          isHomePage 
            ? 'bg-transparent shadow-none border-none' 
            : 'bg-white shadow-sm border-b border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/client" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-teal-600/20">🏢</div>
              <span className={`text-xl font-bold transition-colors duration-300 ${
                isHomePage ? 'text-white drop-shadow-lg' : 'text-slate-800'
              }`}>Inspire Hub</span>
            </Link>
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out ${
                      isHomePage
                        ? (isActive
                            ? 'bg-white/25 text-white backdrop-blur-md shadow-lg shadow-black/10 border border-white/30' 
                            : 'text-white/95 hover:bg-white/15 hover:text-white hover:backdrop-blur-sm hover:shadow-md hover:shadow-black/5 border border-transparent hover:border-white/20')
                        : (isActive
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25 border border-teal-400/30' 
                            : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/50 border border-transparent hover:border-slate-200')
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  );
}
