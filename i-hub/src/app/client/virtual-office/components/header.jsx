'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function VirtualOfficeHeader() {
  return (
    <header className="w-full bg-[#0F766E] px-[1.575rem] py-[1.05rem] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Logo and Brand */}
        <div className="flex items-center gap-[0.7875rem]">
          <div className="relative w-[2.75625rem] h-[2.75625rem]">
            <Image
              src="/LOGOS/Gemini_Generated_Image_lf2zu3lf2zu3lf2z.png"
              alt="I-Hub Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-white text-[1.378125rem] font-semibold">Inspire Hub</span>
        </div>

        {/* Right side - Navigation Links */}
        <nav className="flex items-center gap-[1.575rem]">
          <Link
            href="/client/virtual-office"
            className="text-white text-[0.9646875rem] font-medium hover:text-teal-100 transition-colors"
          >
            Inquire Virtual Office
          </Link>
          <Link
            href="/auth/logout"
            className="text-white text-[0.9646875rem] font-medium hover:text-teal-100 transition-colors"
          >
            Logout
          </Link>
        </nav>
      </div>
    </header>
  );
}
