'use client';

import Link from 'next/link';
import { League_Spartan } from 'next/font/google';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

export default function ReadyToBook() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className={`${leagueSpartan.className} text-3xl md:text-4xl font-bold text-slate-800 mb-4`}>
          Ready to Book Your Space?
        </h2>
        <p className="text-gray-500 mb-8">
          Get started today and find the perfect room for your next meeting or event.
        </p>
        <Link 
          href="/client/private-offices"
          className="group relative inline-block px-8 py-4 text-white font-semibold text-lg rounded-md min-w-[120px] cursor-pointer overflow-hidden bg-[linear-gradient(325deg,#0d5c56_0%,#14a89a_55%,#0d5c56_90%)] bg-[length:280%_auto] bg-[position:initial] shadow-[0px_0px_20px_rgba(15,118,110,0.5),0px_5px_5px_-1px_rgba(13,92,86,0.25),inset_4px_4px_8px_rgba(20,168,154,0.5),inset_-4px_-4px_8px_rgba(10,70,66,0.35)] hover:bg-[position:right_top] active:scale-95 transition-all duration-700 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-700"
        >
          View Available Spaces
          <span className="absolute top-0 left-[-75%] w-[200%] h-full bg-white/30 skew-x-[-20deg] opacity-0 group-hover:opacity-100 group-hover:left-[100%] transition-all duration-500 pointer-events-none z-10" />
        </Link>
      </div>
    </section>
  );
}
