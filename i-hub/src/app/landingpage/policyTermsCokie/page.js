'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { League_Spartan, Roboto } from 'next/font/google';
import Header from '../components/header';
import Footer from '../components/footer';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
});

export default function PolicyTermsCookiePage() {
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [activeTab, setActiveTab] = useState('privacy');

  // Set active tab based on URL hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      if (hash === 'privacy' || hash === 'terms' || hash === 'cookie') {
        setActiveTab(hash);
      }
      
      // Listen for hash changes
      const handleHashChange = () => {
        const newHash = window.location.hash.substring(1);
        if (newHash === 'privacy' || newHash === 'terms' || newHash === 'cookie') {
          setActiveTab(newHash);
        }
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms of Service' },
    { id: 'cookie', label: 'Cookie Policy' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Header Section */}
      <motion.div 
        ref={sectionRef}
        className="w-full bg-[#0F766E] py-16 lg:py-24"
        initial={{ opacity: 0, y: -50 }}
        animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className={`${leagueSpartan.className} text-4xl lg:text-5xl font-bold text-white mb-4`}>
            Legal Information
          </h1>
          <p className={`${roboto.className} text-lg lg:text-xl text-white/90 max-w-2xl mx-auto`}>
            Privacy Policy, Terms of Service, and Cookie Policy
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap justify-center gap-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 ${leagueSpartan.className} font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#0F766E] text-[#0F766E]'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'privacy' && <PrivacyPolicy />}
          {activeTab === 'terms' && <TermsOfService />}
          {activeTab === 'cookie' && <CookiePolicy />}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="space-y-8">
      <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800 mb-6`}>
        Privacy Policy
      </h2>
      <p className={`${roboto.className} text-sm text-slate-600 mb-4`}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="space-y-6">
        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            1. Introduction
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            I-Hub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            2. Information We Collect
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mb-3`}>
            We may collect information about you in a variety of ways:
          </p>
          <ul className={`${roboto.className} text-base text-slate-700 leading-relaxed list-disc list-inside space-y-2 ml-4`}>
            <li><strong>Personal Information:</strong> Name, email address, phone number, company name, and other contact details you provide when inquiring about our services.</li>
            <li><strong>Usage Data:</strong> Information about how you access and use our website, including your IP address, browser type, pages visited, and time spent on pages.</li>
            <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to track activity on our website and store certain information.</li>
          </ul>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            3. How We Use Your Information
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mb-3`}>
            We use the information we collect to:
          </p>
          <ul className={`${roboto.className} text-base text-slate-700 leading-relaxed list-disc list-inside space-y-2 ml-4`}>
            <li>Provide, maintain, and improve our services</li>
            <li>Process your inquiries and respond to your requests</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Detect, prevent, and address technical issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            4. Information Sharing and Disclosure
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
          </p>
          <ul className={`${roboto.className} text-base text-slate-700 leading-relaxed list-disc list-inside space-y-2 ml-4 mt-3`}>
            <li>With service providers who assist us in operating our website and conducting our business</li>
            <li>When required by law or to protect our rights and safety</li>
            <li>In connection with a business transfer or merger</li>
            <li>With your explicit consent</li>
          </ul>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            5. Data Security
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            6. Your Rights
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mb-3`}>
            You have the right to:
          </p>
          <ul className={`${roboto.className} text-base text-slate-700 leading-relaxed list-disc list-inside space-y-2 ml-4`}>
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate or incomplete data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            7. Contact Us
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mt-2`}>
            Email: hello@inspirehub.com<br />
            Phone: +63 917 000 0000<br />
            Address: Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila
          </p>
        </section>
      </div>
    </div>
  );
}

function TermsOfService() {
  return (
    <div className="space-y-8">
      <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800 mb-6`}>
        Terms of Service
      </h2>
      <p className={`${roboto.className} text-sm text-slate-600 mb-4`}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="space-y-6">
        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            1. Acceptance of Terms
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            By accessing and using I-Hub's website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            2. Services Description
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            I-Hub provides workspace solutions including dedicated desks, private offices, and virtual office services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            3. User Obligations
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mb-3`}>
            As a user of our services, you agree to:
          </p>
          <ul className={`${roboto.className} text-base text-slate-700 leading-relaxed list-disc list-inside space-y-2 ml-4`}>
            <li>Provide accurate and complete information when using our services</li>
            <li>Maintain the security of your account credentials</li>
            <li>Use our services in compliance with all applicable laws and regulations</li>
            <li>Not engage in any activity that disrupts or interferes with our services</li>
            <li>Respect the rights of other users and I-Hub staff</li>
            <li>Not use our services for any illegal or unauthorized purpose</li>
          </ul>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            4. Payment Terms
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            All fees for our services are due as specified in your service agreement. Late payments may result in suspension or termination of services. Refunds are subject to the terms outlined in your specific service agreement.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            5. Intellectual Property
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            All content on this website, including text, graphics, logos, images, and software, is the property of I-Hub or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works from this content without our express written permission.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            6. Limitation of Liability
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            I-Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our services. Our total liability shall not exceed the amount you paid for our services in the twelve months preceding the claim.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            7. Termination
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            We reserve the right to terminate or suspend your access to our services immediately, without prior notice, for any breach of these Terms of Service. Upon termination, your right to use the services will cease immediately.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            8. Governing Law
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            These Terms of Service shall be governed by and construed in accordance with the laws of the Philippines, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            9. Changes to Terms
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            10. Contact Information
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            For questions about these Terms of Service, please contact us at:
          </p>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mt-2`}>
            Email: hello@inspirehub.com<br />
            Phone: +63 917 000 0000<br />
            Address: Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila
          </p>
        </section>
      </div>
    </div>
  );
}

function CookiePolicy() {
  return (
    <div className="space-y-8">
      <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800 mb-6`}>
        Cookie Policy
      </h2>
      <p className={`${roboto.className} text-sm text-slate-600 mb-4`}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="space-y-6">
        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            1. What Are Cookies
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            2. How We Use Cookies
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mb-3`}>
            I-Hub uses cookies for the following purposes:
          </p>
          <ul className={`${roboto.className} text-base text-slate-700 leading-relaxed list-disc list-inside space-y-2 ml-4`}>
            <li><strong>Essential Cookies:</strong> Required for the website to function properly. These cannot be disabled.</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings to provide enhanced, personalized features.</li>
            <li><strong>Marketing Cookies:</strong> Used to track visitors across websites to display relevant advertisements.</li>
          </ul>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            3. Types of Cookies We Use
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className={`${leagueSpartan.className} text-lg font-semibold text-slate-800 mb-2`}>
                Session Cookies
              </h4>
              <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
                Temporary cookies that are deleted when you close your browser. They help maintain your session while navigating our website.
              </p>
            </div>
            <div>
              <h4 className={`${leagueSpartan.className} text-lg font-semibold text-slate-800 mb-2`}>
                Persistent Cookies
              </h4>
              <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
                Remain on your device for a set period or until you delete them. They remember your preferences and actions across multiple visits.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            4. Third-Party Cookies
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements, and provide enhanced functionality. These third parties may set their own cookies to collect information about your online activities.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            5. Managing Cookies
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mb-3`}>
            You can control and manage cookies in various ways:
          </p>
          <ul className={`${roboto.className} text-base text-slate-700 leading-relaxed list-disc list-inside space-y-2 ml-4`}>
            <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies. You can also delete cookies that have already been set.</li>
            <li><strong>Cookie Preferences:</strong> Use our cookie consent banner to manage your cookie preferences.</li>
            <li><strong>Third-Party Tools:</strong> Various tools are available to help you manage cookies across different websites.</li>
          </ul>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mt-3`}>
            Please note that disabling cookies may affect the functionality of our website and your user experience.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            6. Updates to This Policy
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Cookie Policy on this page.
          </p>
        </section>

        <section>
          <h3 className={`${leagueSpartan.className} text-xl font-semibold text-slate-800 mb-3`}>
            7. Contact Us
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
            If you have any questions about our use of cookies, please contact us at:
          </p>
          <p className={`${roboto.className} text-base text-slate-700 leading-relaxed mt-2`}>
            Email: hello@inspirehub.com<br />
            Phone: +63 917 000 0000<br />
            Address: Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila
          </p>
        </section>
      </div>
    </div>
  );
}
