'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api, getUserFromCookie } from '@/lib/api';
import { BiSupport, BiX, BiCheckCircle, BiErrorCircle } from 'react-icons/bi';

// Custom Alert Modal Component
function CustomAlert({ isOpen, onClose, type, title, message }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';
  const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';
  const buttonColor = isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <div 
        className={`${bgColor} border-2 ${borderColor} rounded-2xl w-full max-w-md shadow-2xl animate-[slideUp_0.3s_ease] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {isSuccess ? (
              <BiCheckCircle className={`text-6xl ${iconColor}`} />
            ) : (
              <BiErrorCircle className={`text-6xl ${iconColor}`} />
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 ${buttonColor} text-white rounded-lg font-semibold transition-colors`}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function SupportTicketModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [alert, setAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [formData, setFormData] = useState({
    subject: '',
    issue: '',
    priority: 'medium'
  });

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // First check if user is logged in via cookie
      const user = getUserFromCookie();
      
      if (!user || !user.uid) {
        setUserData({
          name: 'N/A',
          company: 'N/A',
          contact: 'N/A',
          email: 'N/A'
        });
        setLoading(false);
        return;
      }

      // Fetch current user profile from API
      const response = await api.get('/api/client/profile/me', { skipCache: true });
      
      if (response.success && response.data) {
        setUserData({
          name: response.data.name || 'N/A',
          company: response.data.companyName || 'N/A',
          contact: response.data.contactNumber || 'N/A',
          email: response.data.email || user.email || 'N/A'
        });
      } else {
        // Set default values with email from cookie
        setUserData({
          name: 'N/A',
          company: 'N/A',
          contact: 'N/A',
          email: user.email || 'N/A'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Try to get email from cookie as fallback
      const user = getUserFromCookie();
      setUserData({
        name: 'N/A',
        company: 'N/A',
        contact: 'N/A',
        email: user?.email || 'N/A'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.issue) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in all required fields (Subject and Issue Description).'
      });
      return;
    }

    try {
      setLoading(true);
      
      const ticketData = {
        clientName: userData?.name || 'N/A',
        companyName: userData?.company || 'N/A',
        contactNumber: userData?.contact || 'N/A',
        email: userData?.email || 'N/A',
        subject: formData.subject,
        message: formData.issue,
        priority: formData.priority,
        status: 'open'
      };

      const response = await api.post('/api/client/tickets/create', ticketData);
      
      if (response.success) {
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Ticket Submitted!',
          message: 'Support ticket submitted successfully! We will get back to you soon.'
        });
        setFormData({ subject: '', issue: '', priority: 'medium' });
        // Close modal after alert is dismissed
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Submission Failed',
          message: 'Failed to submit ticket. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to submit ticket. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />

      {/* Support Ticket Modal */}
      <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-[slideUp_0.3s_ease] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BiSupport className="text-3xl" />
              <div>
                <h2 className="text-2xl font-bold">Need Help?</h2>
                <p className="text-teal-100 text-sm">Submit a support ticket and we'll assist you</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                form="support-ticket-form"
                disabled={loading || !userData}
                className="px-4 py-2 bg-white text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    {userData ? 'Submitting...' : 'Loading...'}
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <BiX className="text-2xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form id="support-ticket-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Loading State */}
          {loading && !userData && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading your information...</span>
              </div>
            </div>
          )}

          {/* Auto-filled Information */}
          {userData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={userData?.name || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-200 text-gray-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={userData?.company || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-200 text-gray-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                value={userData?.contact || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-200 text-gray-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userData?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-200 text-gray-800 font-medium"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief description of your issue"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              placeholder="Please describe the problem you encountered in detail..."
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            />
          </div>
            </>
          )}
        </form>
      </div>
    </div>
    </>,
    document.body
  );
}
