import Link from 'next/link';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center gap-1 px-2">
              <div className="w-0.5 h-2 bg-white"></div>
              <div className="w-0.5 h-3 bg-white"></div>
              <div className="w-0.5 h-4 bg-white"></div>
              <div className="w-0.5 h-5 bg-white"></div>
            </div>
            <span className="text-xl font-semibold text-black">Inspire Hub</span>
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

