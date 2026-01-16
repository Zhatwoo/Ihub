'use client';

import { useRef, useState, useEffect } from 'react';
import { League_Spartan, Roboto } from 'next/font/google';
import { motion, useInView } from 'framer-motion';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
});

export default function LocationCta() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [formData, setFormData] = useState({
    contact: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [waveHeight, setWaveHeight] = useState('200px');

  useEffect(() => {
    const handleResize = () => {
      setWaveHeight(window.innerWidth < 768 ? '200px' : '500px');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.contact || !formData.email) {
        alert('Please fill in both contact number and email address.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: formData.contact,
          email: formData.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send schedule request');
      }

      // Success
      alert('Thank you! We will contact you soon to schedule a meeting.');
      
      // Reset form
      setFormData({
        contact: '',
        email: '',
      });
    } catch (error) {
      console.error('Error submitting schedule request:', error);
      alert(error.message || 'Failed to submit request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="location-map" ref={sectionRef} className="relative bg-white overflow-hidden">
      {/* Top Section - Text Content */}
      <div className="bg-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className={`${leagueSpartan.className} text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-3 sm:mb-4`}
          >
            Not an I-Hub client?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`${roboto.className} text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed px-2`}
          >
            Become part of a network of over 60,000 professionals. With offices and workspaces in 23 countries in some of the world's most prestigious locations.
          </motion.p>
        </div>
      </div>

      {/* Middle Section - Map with Curved Bottom */}
      <div className="relative bg-white overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative h-[400px] sm:h-[600px] md:h-[800px] lg:h-[1100px] w-full"
          style={{ transform: 'translateY(0%)' }}
        >
          {/* Google Maps Embed */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.746831206113!2d121.0521641758693!3d14.556464985924737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c8f53cd592f5%3A0x551030a34dbd4ca6!2sAlliance%20Global%20Tower!5e0!3m2!1sen!2sph!4v1768045789401!5m2!1sen!2sph"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          ></iframe>
        </motion.div>

        {/* Curved Wave Transition - deeper overlap into the map */}
        <div
  className="absolute inset-x-0 bottom-[10px] w-full z-20 pointer-events-none bg-[#0F766E]"
  style={{
    height: waveHeight,
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 5% 12%, 10% 23%, 15% 33%, 20% 42%, 25% 50%, 30% 57%, 35% 63%, 40% 67%, 45% 69%, 50% 70%, 55% 69%, 60% 67%, 65% 63%, 70% 57%, 75% 50%, 80% 42%, 85% 33%, 90% 23%, 95% 12%, 100% 0%)'
  }}
/>
      </div>
      {/* Bottom Section - Schedule a Meeting Form */}
      <div className="py-8 sm:py-12 lg:py-16 relative -mt-48 sm:-mt-64 md:-mt-80 lg:-mt-96 xl:-mt-128 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white border-2 border-[#0F766E] rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl"
          >
            {/* Form Heading */}
            <h2 className={`${leagueSpartan.className} text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F766E] mb-6 sm:mb-8 text-center`}>
              Schedule a Meeting Now!!!
            </h2>

            {/* Form */} 
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Contact Number and Email Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Contact Number */}
                <div>
                  <label
                    htmlFor="contact"
                    className={`${roboto.className} block text-sm font-medium text-slate-700 mb-2`}
                  >
                    Contact #:
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    required
                    className={`${roboto.className} w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent text-sm sm:text-base`}
                    placeholder="Enter your contact number"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="email"
                    className={`${roboto.className} block text-sm font-medium text-slate-700 mb-2`}
                  >
                    Email address:
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`${roboto.className} w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent text-sm sm:text-base`}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Schedule Button */}
              <div className="flex justify-center pt-2 sm:pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`${leagueSpartan.className} bg-[#0F766E] text-white font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-[#0d6b64] transition-colors duration-200 text-base sm:text-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Sending...' : 'Schedule'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
