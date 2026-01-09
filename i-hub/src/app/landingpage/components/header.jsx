import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Gemini_Generated_Image_6qx9a16qx9a16qx9.png"
              alt="I-HUB Office Rentals"
              width={120}
              height={120}
              className="h-auto w-auto"
              priority
            />
            <span className="text-xl font-semibold text-black">I-HUB</span>
          </Link>

          {/* Navigation Links - Bold Dark Navy */}
          <nav className="flex items-center gap-6">
            <Link
              href="/signup"
              className="text-slate-800 font-bold hover:text-slate-600 transition-colors"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="text-slate-800 font-bold hover:text-slate-600 transition-colors"
            >
              Login
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

