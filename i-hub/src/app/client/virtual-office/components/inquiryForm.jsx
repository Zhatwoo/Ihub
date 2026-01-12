'use client';

import { useState } from 'react';

export default function InquiryForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    company: '',
    position: '',
    preferredStartDate: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  return (
    <div className="w-full bg-[#1F2937] py-[4.6rem] px-[2.3rem]">
      <div className="max-w-4xl mx-auto">
        {/* Form Title */}
        <h2 className="text-white text-[2.4796875rem] font-bold text-center mb-[3.9675rem]">Inquiry Form</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-[1.725rem]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.725rem]">
            {/* Left Column */}
            <div className="space-y-[1.725rem]">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-white text-[1.1571875rem] font-medium mb-[0.2645rem]">
                  Full Name<span className="text-red-400 ml-[0.13225rem]">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-[1.3225rem] py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-[1.1571875rem]"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-white text-[1.1571875rem] font-medium mb-[0.2645rem]">
                  Email Address<span className="text-red-400 ml-[0.13225rem]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-[1.3225rem] py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-[1.1571875rem]"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-white text-[1.1571875rem] font-medium mb-[0.2645rem]">
                  Phone Number<span className="text-red-400 ml-[0.13225rem]">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-[1.3225rem] py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-[1.1571875rem]"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-[1.725rem]">
              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-white text-[1.1571875rem] font-medium mb-[0.2645rem]">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-[1.3225rem] py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-[1.1571875rem]"
                  placeholder="Enter your company name"
                />
              </div>

              {/* Position */}
              <div>
                <label htmlFor="position" className="block text-white text-[1.1571875rem] font-medium mb-[0.2645rem]">
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-[1.3225rem] py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-[1.1571875rem]"
                  placeholder="Enter your position"
                />
              </div>

              {/* Preferred Start Date */}
              <div>
                <label htmlFor="preferredStartDate" className="block text-white text-[1.1571875rem] font-medium mb-[0.2645rem]">
                  Preferred Start Date<span className="text-red-400 ml-[0.13225rem]">*</span>
                </label>
                <input
                  type="date"
                  id="preferredStartDate"
                  name="preferredStartDate"
                  value={formData.preferredStartDate}
                  onChange={handleChange}
                  required
                  className="w-full px-[1.3225rem] py-[0.991875rem] bg-white rounded-lg border-none outline-none focus:ring-2 focus:ring-[#0F766E] transition-all text-[1.1571875rem]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-[2.645rem]">
            <button
              type="submit"
              className="px-[3.9675rem] py-[1.3225rem] bg-[#0F766E] text-white font-semibold rounded-lg hover:bg-[#0d7a71] transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-[1.3225rem]"
            >
              Inquire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
