import Image from 'next/image';
import { League_Spartan } from 'next/font/google';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['700'], // Bold weight
  variable: '--font-league-spartan',
});

export default function Hero() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Organic Teal Wave Background */}
      <div className="absolute bottom-[-5%] left-0 right-0 w-full h-full pointer-events-none">
        <svg
          className="absolute bottom-[-5%] left-0 w-full h-full"
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,525 L600,525 C600,525 600,525 100,525 C200,525 400,500 600,400 C800,300 1000,138 1200,138 C1300,138 1380,140 1440,150 L1440,800 L0,800 Z"
            fill="#0F766E"
          />
        </svg>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left Side - Text Content */}
          <div className="space-y-8 -ml-[10%] mt-[15%]">
            <h1 className={`${leagueSpartan.className} text-[91.08px] lg:text-[113.85px] font-bold text-slate-800 leading-[0.85]`}>
              Welcome to <br/> Inspire Hub
            </h1>
            <p className="text-[20.7px] lg:text-[23px] text-slate-700 leading-relaxed max-w-lg">
              The community, workspaces, and technology to make a good impression and get down to business.
            </p>
            <button className="bg-[#0F766E] hover:bg-[#0d6b64] text-white font-semibold px-8 py-4 rounded-[20px] transform scale-x-[1.9] scale-y-[1.7] mt-[15%] ml-[10%] border-[3px] border-white transition-colors duration-200">
              Inquire
            </button>
          </div>

          {/* Right Side - Overlapping Images */}
          <div className="relative h-[500px] lg:h-[600px]">
            {/* Mid Image */}
            <div className="absolute bottom-[15%] left-[20%] w-[362.25px] lg:w-[410.55px] h-[301.875px] lg:h-[338.1px] rounded-2xl overflow-hidden z-[60] border-8 border-white">
              <div className="relative w-full h-full">
                <Image
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop"
                  alt="Modern office workspace"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 via-slate-50/20 to-blue-50/20">
                {/* Windows in background */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-200/40 via-blue-100/20 to-transparent"></div>
                {/* Purple accent strip */}
                <div className="absolute top-4 right-4 w-24 h-2 bg-purple-400 rounded"></div>
                {/* Clock on wall */}
                <div className="absolute top-6 right-8 w-8 h-8 bg-white rounded-full border-2 border-slate-300"></div>
                {/* Desk rows */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-end justify-around px-4 pb-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[60px] h-14 bg-white rounded shadow-sm border border-slate-100"></div>
                  ))}
                </div>
                {/* More desks in second row */}
                <div className="absolute bottom-16 left-0 right-0 flex items-end justify-around px-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[60px] h-12 bg-white/90 rounded shadow-sm border border-slate-100"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Image */}
            <div className="absolute top-[5%] right-[-35%] w-[362.25px] lg:w-[410.55px] h-[301.875px] lg:h-[338.1px] rounded-2xl overflow-hidden z-30 border-8 border-[#0F766E]">
              <div className="relative w-full h-full">
                <Image
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop"
                  alt="Private office space"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 via-slate-50/20 to-slate-100/20">
                {/* Window/Light source */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-blue-100/30 to-transparent"></div>
                {/* Gray textured panel */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-200/50"></div>
                {/* Desk representation */}
                <div className="absolute bottom-8 left-4 right-4 h-16 bg-amber-50 rounded-lg shadow-md border border-amber-100">
                  <div className="absolute top-2 left-2 w-12 h-10 bg-white rounded shadow-sm"></div>
                  <div className="absolute top-4 left-16 w-8 h-1 bg-slate-300 rounded"></div>
                </div>
                {/* Chair */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-slate-800 rounded-t-lg"></div>
              </div>
            </div>

            {/* Bottom Image */}
            <div className="absolute bottom-[5%] right-[-45%] w-[362.25px] lg:w-[410.55px] h-[301.875px] lg:h-[338.1px] rounded-2xl overflow-hidden z-50 border-8 border-white">
              <div className="relative w-full h-full">
                <Image
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop"
                  alt="Co-working space"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 via-slate-50/20 to-blue-50/20">
                {/* Windows in background */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-200/40 via-blue-100/20 to-transparent"></div>
                {/* Desk rows */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-end justify-around px-3 pb-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[65px] h-12 bg-white rounded shadow-sm border border-slate-100"></div>
                  ))}
                </div>
                {/* More desks in second row */}
                <div className="absolute bottom-14 left-0 right-0 flex items-end justify-around px-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[65px] h-11 bg-white/90 rounded shadow-sm border border-slate-100"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - Bottom Center */}
        <div className="mt-16 lg:mt-24 flex justify-center">
          <div className="relative w-full max-w-2xl">
            <div className="flex items-center bg-[#0F766E] rounded-[30px] border-[5px] border-white overflow-hidden">
              {/* Search Icon */}
              <div className="pl-4 pr-2">
                <svg
                  className="w-6 h-6 text-teal-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              
              {/* Input Field */}
              <input
                type="text"
                placeholder="Search by room, capacity, or location..."
                className="flex-1 px-4 py-4 bg-[#0F766E] text-teal-300 placeholder-teal-300 focus:outline-none rounded-l-[30px]"
              />
              
              {/* Search Button */}
              <button className="bg-white hover:bg-gray-100 text-[#0F766E] font-semibold px-8 py-4 rounded-r-xl transition-colors duration-200">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
