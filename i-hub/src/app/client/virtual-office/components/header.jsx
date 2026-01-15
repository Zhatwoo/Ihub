'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function VirtualOfficeHeader() {
  const router = useRouter();

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
      </div>
    </header>
  );
}
