'use client';

import { League_Spartan, Roboto } from 'next/font/google';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
});

const socials = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
  { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin' },
  { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
  { label: 'TikTok', href: 'https://tiktok.com', icon: 'tiktok' },
];

export default function Footer() {
  const router = useRouter();

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    
    // Check if we're on the landing page
    if (window.location.pathname === '/') {
      const element = document.getElementById(targetId);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      // If not on landing page, navigate first then scroll
      router.push('/');
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  return (
    <footer className="bg-[#0F766E] text-white py-12 lg:py-16">
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-14 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-3">
          <h2 className={`${leagueSpartan.className} text-2xl lg:text-3xl font-semibold`}>Inspire Hub</h2>
          <p className={`${roboto.className} text-sm lg:text-base text-white/90 leading-relaxed`}>
            Premium workspaces in Alliance Global Tower with flexible offices, dedicated desks, virtual offices,
            and thoughtfully designed amenities to keep teams productive.
          </p>
          <div className={`${roboto.className} text-sm lg:text-base space-y-1 text-white/90`}>
            <p>Alliance Global Tower, Taguig, Metro Manila</p>
            <p>Contact #: +63 917 000 0000</p>
            <p>Email: hello@inspirehub.com</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:col-span-2 gap-12">
          <div className="space-y-4 min-w-[180px]">
            <h3 className={`${leagueSpartan.className} text-lg font-semibold`}>Product</h3>
            <ul className={`${roboto.className} text-sm lg:text-base space-y-2 text-white/90`}>
              <li>Dedicated Desks</li>
              <li>Private Offices</li>
              <li>Virtual Office</li>
              <li>Meeting Rooms</li>
            </ul>
          </div>

          <div className="space-y-4 min-w-[180px]">
            <h3 className={`${leagueSpartan.className} text-lg font-semibold`}>Resources</h3>
            <ul className={`${roboto.className} text-sm lg:text-base space-y-2 text-white/90`}>
              <li>
                <Link href="/landingpage/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/#about-i-hub" 
                  className="hover:text-white transition-colors"
                  onClick={(e) => handleSmoothScroll(e, 'about-i-hub')}
                >
                  About I-Hub
                </Link>
              </li>
              <li>
                <Link href="/landingpage/contacts" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  href="/#location-map" 
                  className="hover:text-white transition-colors"
                  onClick={(e) => handleSmoothScroll(e, 'location-map')}
                >
                  Location Map
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 flex-1">
            <h3 className={`${leagueSpartan.className} text-lg font-semibold`}>Connect With Us</h3>
            <p className={`${roboto.className} text-sm lg:text-base text-white/90`}>
              Follow us for updates and workspace news.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {socials.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
                  aria-label={item.label}
                >
                  <SocialIcon type={item.icon} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-white/10">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex flex-col sm:flex-row justify-between items-center text-xs lg:text-sm text-white/80 gap-2">
          <span className={roboto.className}>© {new Date().getFullYear()} Inspire Hub. All rights reserved.</span>
          <div className={`flex items-center gap-4 ${roboto.className}`}>
            <Link href="/landingpage/policyTermsCokie#privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/landingpage/policyTermsCokie#terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/landingpage/policyTermsCokie#cookie" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ type }) {
  const common = 'w-5 h-5';
  if (type === 'facebook') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13 20v-7h2.5l.5-3H13V8.5c0-.9.3-1.5 1.6-1.5H16V4.1C15.6 4 14.4 4 13 4c-2.4 0-4 1.6-4 4.1V10H7v3h2v7h4z" />
      </svg>
    );
  }
  if (type === 'instagram') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm11 1.25a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0zM12 8.5A3.5 3.5 0 1 1 8.5 12A3.5 3.5 0 0 1 12 8.5zm0 2a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 12 10.5z" />
      </svg>
    );
  }
  if (type === 'linkedin') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.5 9H3.5v12h3V9zm.2-4.25A1.74 1.74 0 0 0 5 3a1.76 1.76 0 1 0 0 3.51a1.74 1.74 0 0 0 1.7-1.76zM21 21v-6.8c0-3.3-1.8-4.8-4.2-4.8a3.66 3.66 0 0 0-3.3 1.8H13V9H10v12h3v-6.3c0-1.7.9-2.7 2.3-2.7s2 1 2 2.8V21z" />
      </svg>
    );
  }
  if (type === 'youtube') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.3 4 12 4 12 4h-.1s-3.3 0-6.7.2c-.4.1-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2 8.9 2 10.6v1.6c0 1.7.2 3.4.2 3.4s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9 1.7.2 6.7.2 6.7.2s3.3 0 6.7-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.4v-1.6c0-1.7-.2-3.4-.2-3.4zM10 14.7V8.9l5.2 2.9L10 14.7z" />
      </svg>
    );
  }
  if (type === 'tiktok') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.3 6.7c-.8-.6-1.3-1.5-1.4-2.5V4h-2.5v10.3c0 .5-.2 1.1-.6 1.5-.7.7-1.9.7-2.6 0-.7-.7-.7-1.9 0-2.6.4-.4 1-.6 1.5-.6v-2.5c-1.2 0-2.3.5-3.1 1.3-1.7 1.7-1.7 4.5 0 6.2 1.7 1.7 4.5 1.7 6.2 0 .8-.8 1.3-1.9 1.3-3.1V9.4c.6.4 1.2.7 1.9.9l.6.2V7.9l-.6-.2c-.3-.2-.5-.3-.8-.5z" />
      </svg>
    );
  }
  return null;
}