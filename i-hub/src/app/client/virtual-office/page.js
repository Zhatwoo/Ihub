'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function VirtualOffice() {
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    position: '',
    phoneNumber: '',
    preferredStartDate: ''
  });

  const features = [
    { icon: '📍', title: 'Business Address', desc: 'Premium 5-star address for your business' },
    { icon: '📞', title: 'Local Phone', desc: 'Dedicated number with receptionist' },
    { icon: '🎧', title: 'On-Site Support', desc: 'Secretaries and IT team available' },
    { icon: '🏢', title: 'Meeting Rooms', desc: 'Fully equipped rooms available' },
    { icon: '📱', title: 'Mobile Business', desc: 'Take calls anywhere you go' },
    { icon: '📶', title: 'Fast Wifi', desc: 'Super fast, secure connection' }
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const openInquiryModal = () => setShowInquiryModal(true);
  const closeInquiryModal = () => {
    if (!loading) {
      setShowInquiryModal(false);
      setFormData({ fullName: '', company: '', email: '', position: '', phoneNumber: '', preferredStartDate: '' });
    }
  };
  const showAlertMessage = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'virtual-office-clients'), {
        ...formData,
        status: 'inquiry',
        createdAt: new Date().toISOString()
      });
      closeInquiryModal();
      showAlertMessage('success', 'Inquiry submitted successfully!');
    } catch (error) {
      showAlertMessage('error', 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col bg-white">
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left - Info */}
            <div className="space-y-6 lg:space-y-8">
              <div className="flex items-center gap-4 lg:gap-5">
                <div className="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-xl">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-800">Virtual Office</h1>
              </div>
              <p className="text-gray-600 text-lg lg:text-xl xl:text-2xl leading-relaxed">
                Establish a strong presence with a prestigious business address, local phone number, dedicated receptionist services, and comprehensive support—at a fraction of traditional costs.
              </p>
              <button 
                onClick={openInquiryModal}
                className="px-8 lg:px-10 py-4 lg:py-5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl lg:rounded-2xl text-lg lg:text-xl font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                Inquire Now
              </button>
            </div>

            {/* Right - Features Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-5">
              {features.map((feature, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-5 lg:p-6 xl:p-8 border border-gray-100 hover:shadow-lg hover:border-teal-300 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-teal-100 rounded-xl lg:rounded-2xl flex items-center justify-center text-2xl lg:text-3xl xl:text-4xl mb-3 lg:mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-slate-800 font-bold text-sm lg:text-base xl:text-lg mb-1 lg:mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-xs lg:text-sm xl:text-base leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Alert */}
      {alert.show && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg animate-[slideInRight_0.3s_ease] ${alert.type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-500 text-white'}`}>
          <p className="font-medium text-sm">{alert.message}</p>
        </div>
      )}

      {/* Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
              <h2 className="text-slate-800 text-lg font-bold">Virtual Office Inquiry</h2>
              <button onClick={closeInquiryModal} disabled={loading} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-1.5 font-medium text-sm">Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 font-medium text-sm">Company *</label>
                <input type="text" name="company" value={formData.company} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-medium text-sm">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1.5 font-medium text-sm">Position *</label>
                  <input type="text" name="position" value={formData.position} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-medium text-sm">Phone *</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1.5 font-medium text-sm">Start Date *</label>
                  <input type="date" name="preferredStartDate" value={formData.preferredStartDate} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeInquiryModal} disabled={loading} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 transition-all disabled:opacity-60">
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
