import Link from 'next/link';

export default function ClientHomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">Find Your Perfect Meeting Space</h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Book premium private offices and event spaces at Inspire Hub. Professional environments for your business needs.</p>
          <Link href="/client/private-offices" className="inline-block px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-teal-600/30 hover:-translate-y-1 hover:shadow-xl transition-all">
            Browse Private Offices
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">Why Choose Inspire Hub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-slate-50 border border-gray-100">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🏢</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Premium Spaces</h3>
              <p className="text-gray-600">Modern, well-equipped private offices designed for productivity and comfort.</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-slate-50 border border-gray-100">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📅</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Easy Booking</h3>
              <p className="text-gray-600">Simple online reservation system. Book your space in just a few clicks.</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-slate-50 border border-gray-100">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">✨</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Full Amenities</h3>
              <p className="text-gray-600">High-speed WiFi, projectors, whiteboards, and catering options available.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-teal-600">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Book Your Space?</h2>
          <p className="text-teal-100 mb-8">Get started today and find the perfect room for your next meeting or event.</p>
          <Link href="/client/private-offices" className="inline-block px-8 py-4 bg-white text-teal-700 rounded-xl font-semibold shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all">
            View Available Offices
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center text-lg">🏢</div>
            <span className="text-lg font-bold text-white">Inspire Hub</span>
          </div>
          <p className="text-sm">© 2026 Inspire Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

