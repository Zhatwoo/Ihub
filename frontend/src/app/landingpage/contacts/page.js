'use client';

import { useState, useRef, Suspense } from 'react';
import { motion, useInView } from 'framer-motion';
import { League_Spartan, Roboto } from 'next/font/google';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import LandingPageHeader from '../components/header.jsx';
import ClientHeader from '@/app/client/home/components/header.jsx';
import Footer from '../components/footer.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { api } from '@/lib/api';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
});

function ContactsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isFromClient = returnTo && returnTo.includes('/client');
  
  const sectionRef = useRef(null);
  const formRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const isFormInView = useInView(formRef, { once: true, amount: 0.2 });

  const handleBack = () => {
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.back();
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/emails/contact', formData);

      if (response.success) {
        // Success
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Message Sent Successfully!',
          message: response.message || 'Thank you for contacting us! We have received your message and will get back to you soon.',
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Failed to Send Message',
        message: error.message || 'There was an error sending your message. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Address',
      content: 'Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila',
      link: null
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone',
      content: '(02) 5322 1002',
      link: 'tel:(02) 5322 1002'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email',
      content: 'inspire-ihub@gmail.com',
      link: 'mailto:inspire-ihub@gmail.com'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {isFromClient ? <ClientHeader /> : <LandingPageHeader />}
      <motion.div 
        ref={sectionRef}
        className="w-full bg-[#0F766E] py-16 lg:py-24 relative"
        initial={{ opacity: 0, y: -50 }}
        animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {isFromClient && (
          <button
            onClick={handleBack}
            className="absolute top-6 left-6 lg:left-12 flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className={`${roboto.className} font-medium`}>Back</span>
          </button>
        )}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className={`${leagueSpartan.className} text-4xl lg:text-5xl font-bold text-white mb-4`}>
            Contact Us
          </h1>
          <p className={`${roboto.className} text-lg lg:text-xl text-white/90 max-w-2xl mx-auto`}>
            Get in touch with us. We're here to help you find the perfect workspace solution for your business.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isSectionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800 mb-6`}>
                Get in Touch
              </h2>
              <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mb-8`}>
                Whether you're looking for a dedicated desk, private office, or virtual office solution, our team is ready to assist you. Reach out to us through any of the channels below.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 p-6 bg-[#F8FAFC] rounded-xl hover:bg-[#F1F5F9] transition-colors"
                >
                  <div className="shrink-0 w-12 h-12 bg-[#0F766E] rounded-lg flex items-center justify-center text-white">
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`${leagueSpartan.className} text-lg font-semibold text-slate-800 mb-1`}>
                      {info.title}
                    </h3>
                    {info.link ? (
                      <Link 
                        href={info.link}
                        className={`${roboto.className} text-base text-slate-600 hover:text-[#0F766E] transition-colors`}
                      >
                        {info.content}
                      </Link>
                    ) : (
                      <p className={`${roboto.className} text-base text-slate-600`}>
                        {info.content}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.6 }}
              className="pt-6"
            >
              <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-4`}>
                Follow Us
              </h3>
              <div className="flex items-center gap-4">
                {[
                  { name: 'Facebook', href: 'https://www.facebook.com/inspireholdings?mibextid=ZbWKwL', icon: 'facebook' },
                  { name: 'Instagram', href: 'https://www.instagram.com/inspire.holdings.inc/?igsh=MTdscWZsZXlubnY3aw%3D%3D#', icon: 'instagram' },
                  { name: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin' },
                  { name: 'YouTube', href: 'https://www.youtube.com/channel/UCUGE-qPvLqYmZhQ25aLXm6A', icon: 'youtube' },
                ].map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-[#0F766E] hover:bg-[#0d6b64] text-white flex items-center justify-center transition-colors"
                    aria-label={social.name}
                  >
                    <SocialIcon type={social.icon} />
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            ref={formRef}
            initial={{ opacity: 0, x: 50 }}
            animate={isFormInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="bg-[#1F2937] rounded-2xl p-8 lg:p-10"
          >
            <h2 className={`${leagueSpartan.className} text-3xl font-bold text-white mb-6`}>
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isFormInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <label htmlFor="name" className={`block ${roboto.className} text-white text-base font-medium mb-2`}>
                  Full Name<span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-base hover:bg-gray-50"
                  placeholder="Enter your full name"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isFormInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <label htmlFor="contact-email" className={`block ${roboto.className} text-white text-base font-medium mb-2`}>
                  Email Address<span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-base hover:bg-gray-50"
                  placeholder="Enter your email address"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isFormInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <label htmlFor="phone" className={`block ${roboto.className} text-white text-base font-medium mb-2`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-base hover:bg-gray-50"
                  placeholder="Enter your phone number"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isFormInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <label htmlFor="subject" className={`block ${roboto.className} text-white text-base font-medium mb-2`}>
                  Subject<span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-base hover:bg-gray-50"
                  placeholder="What is this regarding?"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isFormInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <label htmlFor="message" className={`block ${roboto.className} text-white text-base font-medium mb-2`}>
                  Message<span className="text-red-400 ml-1">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-base hover:bg-gray-50 resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isFormInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="pt-2"
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.05, boxShadow: loading ? 'none' : '0 10px 25px rgba(15, 118, 110, 0.4)' }}
                  whileTap={{ scale: loading ? 1 : 0.95 }}
                  className={`w-full px-8 py-4 bg-[#0F766E] text-white ${leagueSpartan.className} font-semibold rounded-lg hover:bg-[#0d7a71] transition-all duration-300 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
      <Footer />
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ContactsContent />
    </Suspense>
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
