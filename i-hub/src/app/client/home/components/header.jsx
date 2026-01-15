'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const navItems = [
  { name: 'Home', href: '/client' },
  { name: 'Virtual Office', href: '/client/virtual-office' },
  { name: 'My Bookings', href: '/client/bookings' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleContactClick = () => {
    // Store referrer in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('contactReturnTo', '/client/home');
    }
  };

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
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/client" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-teal-600/20">🏢</div>
          <span className="text-xl font-bold text-slate-800">Inspire Hub</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === item.href ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-100 hover:text-slate-800'}`}>
              {item.name}
            </Link>
          ))}
          <Link 
            href="/landingpage/contacts?returnTo=/client/home" 
            onClick={handleContactClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/landingpage/contacts' ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-100 hover:text-slate-800'}`}
          >
            Contact
          </Link>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-gray-600 hover:bg-gray-100 hover:text-slate-800"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

