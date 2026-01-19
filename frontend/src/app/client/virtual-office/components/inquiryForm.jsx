'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ConfirmationModal from '@/app/landingpage/components/ConfirmationModal';
import { api } from '@/lib/api';

export default function InquiryForm() {
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const isFormInView = useInView(formRef, { once: true, amount: 0.2 });
  const isTitleInView = useInView(titleRef, { once: true, amount: 0.3 });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    company: '',
    position: '',
    preferredStartDate: ''
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
      // Validate required fields
      if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.preferredStartDate) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Missing Information',
          message: 'Please fill in all required fields (Full Name, Email, Phone Number, and Preferred Start Date).',
        });
        setLoading(false);
        return;
      }

      const response = await api.post('/api/emails/inquiry', formData);

      if (response.success) {
        // Success
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Inquiry Sent Successfully!',
          message: response.message || 'Thank you for your interest in our Virtual Office solution! We have received your inquiry and will get back to you soon.',
        });

        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phoneNumber: '',
          company: '',
          position: '',
          preferredStartDate: ''
        });
      } else {
        throw new Error(response.message || 'Failed to send inquiry');
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Failed to Send Inquiry',
        message: error.message || 'There was an error sending your inquiry. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  return (
    <div id="inquiry-form" className="w-full bg-[#1F2937] py-8 sm:py-12 md:py-[4.6rem] px-4 sm:px-6 md:px-[2.3rem]">
      <div className="max-w-4xl mx-auto">
        {/* Form Title */}
        <motion.h2 
          ref={titleRef}
          initial={{ opacity: 0, y: -30 }}
          animate={isTitleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-white text-2xl sm:text-3xl md:text-[2.4796875rem] font-bold text-center mb-6 sm:mb-8 md:mb-[3.9675rem]"
        >
          Inquiry Form
        </motion.h2>

        {/* Form */}
        <motion.form 
          ref={formRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isFormInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="space-y-4 sm:space-y-6 md:space-y-[1.725rem]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-[1.725rem]">
            {/* Left Column */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={isFormInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
              className="space-y-4 sm:space-y-6 md:space-y-[1.725rem]"
            >
              {/* Full Name */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isFormInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <label htmlFor="fullName" className="block text-white text-sm sm:text-base md:text-[1.1571875rem] font-medium mb-1 sm:mb-[0.2645rem]">
                  Full Name<span className="text-red-400 ml-1 sm:ml-[0.13225rem]">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 md:px-[1.3225rem] py-2 sm:py-3 md:py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-sm sm:text-base md:text-[1.1571875rem] hover:bg-gray-50"
                  placeholder="Enter your full name"
                />
              </motion.div>

              {/* Email Address */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isFormInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <label htmlFor="email" className="block text-white text-sm sm:text-base md:text-[1.1571875rem] font-medium mb-1 sm:mb-[0.2645rem]">
                  Email Address<span className="text-red-400 ml-1 sm:ml-[0.13225rem]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 md:px-[1.3225rem] py-2 sm:py-3 md:py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-sm sm:text-base md:text-[1.1571875rem] hover:bg-gray-50"
                  placeholder="Enter your email address"
                />
              </motion.div>

              {/* Phone Number */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isFormInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <label htmlFor="phoneNumber" className="block text-white text-sm sm:text-base md:text-[1.1571875rem] font-medium mb-1 sm:mb-[0.2645rem]">
                  Phone Number<span className="text-red-400 ml-1 sm:ml-[0.13225rem]">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 md:px-[1.3225rem] py-2 sm:py-3 md:py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-sm sm:text-base md:text-[1.1571875rem] hover:bg-gray-50"
                  placeholder="Enter your phone number"
                />
              </motion.div>
            </motion.div>

            {/* Right Column */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={isFormInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
              className="space-y-4 sm:space-y-6 md:space-y-[1.725rem]"
            >
              {/* Company */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isFormInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <label htmlFor="company" className="block text-white text-sm sm:text-base md:text-[1.1571875rem] font-medium mb-1 sm:mb-[0.2645rem]">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 md:px-[1.3225rem] py-2 sm:py-3 md:py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-sm sm:text-base md:text-[1.1571875rem] hover:bg-gray-50"
                  placeholder="Enter your company name"
                />
              </motion.div>

              {/* Position */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isFormInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <label htmlFor="position" className="block text-white text-sm sm:text-base md:text-[1.1571875rem] font-medium mb-1 sm:mb-[0.2645rem]">
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 md:px-[1.3225rem] py-2 sm:py-3 md:py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-sm sm:text-base md:text-[1.1571875rem] hover:bg-gray-50"
                  placeholder="Enter your position"
                />
              </motion.div>

              {/* Preferred Start Date */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isFormInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <label htmlFor="preferredStartDate" className="block text-white text-sm sm:text-base md:text-[1.1571875rem] font-medium mb-1 sm:mb-[0.2645rem]">
                  Preferred Start Date<span className="text-red-400 ml-1 sm:ml-[0.13225rem]">*</span>
                </label>
                <input
                  type="date"
                  id="preferredStartDate"
                  name="preferredStartDate"
                  value={formData.preferredStartDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 md:px-[1.3225rem] py-2 sm:py-3 md:py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-sm sm:text-base md:text-[1.1571875rem] hover:bg-gray-50"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isFormInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.8 }}
            className="flex justify-center mt-6 sm:mt-8 md:mt-[2.645rem]"
          >
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.05, boxShadow: loading ? 'none' : '0 10px 25px rgba(15, 118, 110, 0.4)' }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
              className="w-full sm:w-auto px-6 sm:px-8 md:px-[3.9675rem] py-3 sm:py-4 md:py-[1.3225rem] bg-[#0F766E] text-white font-semibold rounded-lg hover:bg-[#0d7a71] transition-all duration-300 shadow-lg text-base sm:text-lg md:text-[1.3225rem] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Inquire'}
            </motion.button>
          </motion.div>
        </motion.form>
      </div>

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
