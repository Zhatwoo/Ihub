'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { League_Spartan, Roboto } from 'next/font/google';
import Header from '../components/header.jsx';
import Footer from '../components/footer.jsx';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
});

export default function FAQPage() {
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          question: 'What is I-Hub?',
          answer: 'I-Hub is a premium workspace provider located in Alliance Global Tower, Taguig, Metro Manila. We offer flexible office solutions including dedicated desks, private offices, and virtual offices designed to help businesses thrive in a collaborative and inspiring environment.'
        },
        {
          question: 'Where is I-Hub located?',
          answer: 'I-Hub is located at Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila. Our prime location provides easy access to major business districts and transportation hubs.'
        },
        {
          question: 'What services does I-Hub offer?',
          answer: 'I-Hub offers a comprehensive range of workspace solutions: Dedicated Desks for individuals who need a consistent workspace, Private Offices for teams requiring privacy, and Virtual Office services for businesses needing a professional address and support services.'
        },
        {
          question: 'How do I get started with I-Hub?',
          answer: 'Getting started is easy! You can visit our website, fill out an inquiry form, or contact us directly. Our team will guide you through the process, help you choose the right workspace solution, and arrange a tour of our facilities.'
        }
      ]
    },
    {
      category: 'Virtual Office',
      questions: [
        {
          question: 'What is included in a Virtual Office package?',
          answer: 'Our Virtual Office package includes a prestigious business address at Alliance Global Tower, a local phone number with dedicated receptionist services, mail handling and forwarding, and comprehensive corporate registration support.'
        },
        {
          question: 'Can I use the Virtual Office address for business registration?',
          answer: 'Yes, our Virtual Office address can be used for business registration and official documentation. We provide all necessary documentation and support to help you establish your business presence.'
        },
        {
          question: 'How does the phone answering service work?',
          answer: 'Our professional receptionists answer calls during business hours using your business name. They can take messages, forward calls to your mobile number, and provide basic information about your business. You can customize how calls are handled based on your preferences.'
        },
        {
          question: 'Do I get access to physical office space with Virtual Office?',
          answer: 'Virtual Office primarily provides business address and communication services. However, Virtual Office members can upgrade to dedicated desks or private offices when needed.'
        }
      ]
    },
    {
      category: 'Dedicated Desks & Private Offices',
      questions: [
        {
          question: 'What is the difference between a Dedicated Desk and a Private Office?',
          answer: 'A Dedicated Desk is a fixed workspace in a shared area, perfect for individuals who need consistency. A Private Office is an enclosed space for teams, providing privacy, security, and the ability to customize the space to your needs.'
        },
        {
          question: 'What amenities are included with workspace rentals?',
          answer: 'All workspace rentals include high-speed internet, access to common areas, kitchen facilities, printing and scanning services, mail handling, and 24/7 building access. Private offices also include furniture and can be customized.'
        },
        {
          question: 'Can I customize my Private Office?',
          answer: 'Yes! Private Office tenants can customize their space with their own furniture, branding, and layout. We work with you to create an environment that reflects your company culture and meets your specific needs.'
        },
        {
          question: 'Are there flexible lease terms available?',
          answer: 'Yes, we offer flexible lease terms to accommodate different business needs. You can choose from monthly, quarterly, or annual agreements. We also offer short-term options for businesses in transition.'
        }
      ]
    },
    {
      category: 'Pricing & Payments',
      questions: [
        {
          question: 'What are the pricing options?',
          answer: 'Pricing varies based on the type of workspace and lease term. We offer competitive rates for Virtual Offices, Dedicated Desks, and Private Offices. Contact us for detailed pricing information tailored to your specific needs.'
        },
        {
          question: 'What payment methods are accepted?',
          answer: 'We accept various payment methods including bank transfers, credit cards, and checks. Payment terms and schedules can be customized based on your lease agreement.'
        },
        {
          question: 'Are there any hidden fees?',
          answer: 'No hidden fees! Our pricing is transparent. All costs are clearly outlined in your lease agreement. Additional services or extra amenities are charged separately and clearly communicated.'
        },
        {
          question: 'Can I get a discount for long-term commitments?',
          answer: 'Yes, we offer discounts for annual commitments and multi-desk arrangements. Contact us to discuss the best pricing option for your business needs.'
        }
      ]
    },
    {
      category: 'Support & Services',
      questions: [
        {
          question: 'What support services are available?',
          answer: 'I-Hub provides comprehensive support including IT assistance, administrative support, mail handling, phone answering services, and access to our business network. Our team is available to help with various business needs.'
        },
        {
          question: 'Is there IT support available?',
          answer: 'Yes, we have an in-house IT support team available to assist with technical issues, network setup, and equipment troubleshooting. They ensure your workspace technology runs smoothly.'
        },
        {
          question: 'Can I receive mail and packages at I-Hub?',
          answer: 'Absolutely! We accept mail and packages on your behalf. You can pick them up during business hours, or we can arrange for forwarding to your preferred address. This service is included with most workspace plans.'
        },
        {
          question: 'What are the operating hours?',
          answer: 'Our reception and support services are available during standard business hours (Monday to Friday, 9 AM to 6 PM). However, workspace access is available 24/7 for members with keycard access.'
        }
      ]
    }
  ];

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
            Frequently Asked Questions
          </h1>
          <p className={`${roboto.className} text-lg lg:text-xl text-white/90 max-w-2xl mx-auto`}>
            Find answers to common questions about I-Hub's workspace solutions and services.
          </p>
        </div>
      </motion.div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        {faqs.map((category, categoryIndex) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 30 }}
            animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
            className="mb-12"
          >
            <h2 className={`${leagueSpartan.className} text-2xl lg:text-3xl font-bold text-slate-800 mb-6`}>
              {category.category}
            </h2>
            <div className="space-y-4">
              {category.questions.map((faq, index) => {
                const globalIndex = faqs.slice(0, categoryIndex).reduce((acc, cat) => acc + cat.questions.length, 0) + index;
                const isOpen = openIndex === globalIndex;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, delay: (categoryIndex * 0.1) + (index * 0.05) }}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => toggleQuestion(globalIndex)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#0F766E] rounded-lg"
                    >
                      <span className={`${leagueSpartan.className} text-lg font-semibold text-slate-800 pr-4`}>
                        {faq.question}
                      </span>
                      <motion.svg
                        className="w-5 h-5 text-[#0F766E] shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4">
                            <p className={`${roboto.className} text-base text-slate-700 leading-relaxed`}>
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 p-8 bg-[#F8FAFC] rounded-xl border border-gray-200 text-center"
        >
          <h3 className={`${leagueSpartan.className} text-2xl font-bold text-slate-800 mb-4`}>
            Still have questions?
          </h3>
          <p className={`${roboto.className} text-base text-slate-700 mb-6`}>
            Can't find the answer you're looking for? Our team is here to help.
          </p>
          <a
            href="/landingpage/contacts"
            className={`inline-block ${leagueSpartan.className} bg-[#0F766E] hover:bg-[#0d6b64] text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-300`}
          >
            Contact Us
          </a>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
