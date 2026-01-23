'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RequestList() {
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  // Fetch schedules from API
  const fetchSchedules = async () => {
    try {
      // Removed: Log (may contain request data)
      const response = await api.get('/api/admin/private-office/requests', { skipCache: true });
      // Removed: Log containing request data
      if (response.success && response.data) {
        // Removed: Log containing request count with data
        setSchedules(response.data.requests || []);
      }
    } catch (error) {
      console.error('❌ Error fetching schedules:', error);
      setSchedules([]);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Mount state for portals
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApprove = async (request) => {
    setIsLoading(true);
    const userId = request.userId;
    const bookingId = request.id;
    console.log('✅ Approving request for user:', userId, 'booking:', bookingId);
    try {
      console.log('📤 Sending PUT request to /api/admin/private-office/requests/' + userId + '/' + bookingId + '/status');
      const response = await api.put(`/api/admin/private-office/requests/${userId}/${bookingId}/status`, { 
        status: 'approved' 
      });
      // Removed: Log containing response data
      if (response.success) {
        setSuccessMessage('Request approved successfully!');
        setShowSuccessModal(true);
        
        // Wait 2.5 seconds to allow Firebase to update
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Close modal and refetch requests
        setShowSuccessModal(false);
        setIsLoading(false);
        console.log('🔄 Refetching requests...');
        await fetchSchedules();
      }
    } catch (error) {
      console.error('❌ Error approving request:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      setIsLoading(false);
      setShowSuccessModal(false);
    }
  };

  const handleReject = async (request) => {
    setIsLoading(true);
    const userId = request.userId;
    const bookingId = request.id;
    console.log('🔴 Rejecting request for user:', userId, 'booking:', bookingId);
    try {
      console.log('📤 Sending PUT request to /api/admin/private-office/requests/' + userId + '/' + bookingId + '/status');
      const response = await api.put(`/api/admin/private-office/requests/${userId}/${bookingId}/status`, { 
        status: 'rejected' 
      });
      // Removed: Log containing response data
      if (response.success) {
        setSuccessMessage('Request rejected successfully!');
        setShowSuccessModal(true);
        
        // Wait 2.5 seconds to allow Firebase to update
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Close modal and refetch requests
        setShowSuccessModal(false);
        setIsLoading(false);
        console.log('🔄 Refetching requests...');
        await fetchSchedules();
      }
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      setIsLoading(false);
      setShowSuccessModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 animate-fadeIn">
      {/* Loading Overlay - Using Portal to cover entire page */}
      {isLoading && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
            <p className="text-slate-800 font-semibold">Processing request...</p>
          </div>
        </div>,
        document.body
      )}

      {/* Success Modal - Using Portal to cover entire page */}
      {showSuccessModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 animate-[slideUp_0.3s_ease]">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Approval Done</h3>
            <p className="text-gray-600 text-center text-sm">{successMessage}</p>
            <p className="text-gray-500 text-xs">Refreshing page...</p>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200 gap-3 sm:gap-0">
        <div>
          <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Pending Requests</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Review and manage reservation requests</p>
        </div>
        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap">
          {schedules.length} pending
        </span>
      </div>
      
      {schedules.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p className="text-slate-800 font-semibold text-base sm:text-lg">No Pending Requests</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">All reservation requests have been processed</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <div className="min-w-full inline-block align-middle">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Full Name</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Email</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Contact</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Office</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Start Date</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Requested</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.map((request) => (
                  <tr key={request.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <p className="text-slate-800 font-semibold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" title={request.clientName}>
                        {request.clientName}
                      </p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" title={request.email || 'N/A'}>
                        {request.email || 'N/A'}
                      </p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none" title={request.contactNumber || 'N/A'}>
                        {request.contactNumber || 'N/A'}
                      </p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <p className="text-slate-800 font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none" title={request.room}>
                        {request.room}
                      </p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <p className="text-slate-800 font-medium text-xs sm:text-sm whitespace-nowrap">
                        {request.startDate ? 
                          (() => {
                            try {
                              // Handle Firestore timestamp object
                              if (typeof request.startDate === 'object' && request.startDate.toDate) {
                                return request.startDate.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                              }
                              // Handle ISO string or regular date
                              const date = new Date(request.startDate);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                              }
                              return 'N/A';
                            } catch (e) {
                              return 'N/A';
                            }
                          })()
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <p className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                        {request.createdAt ? 
                          (() => {
                            try {
                              // Handle Firestore timestamp object
                              if (typeof request.createdAt === 'object' && request.createdAt.toDate) {
                                return request.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                              }
                              // Handle ISO string or regular date
                              const date = new Date(request.createdAt);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                              }
                              return 'N/A';
                            } catch (e) {
                              return 'N/A';
                            }
                          })()
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                        <button 
                          onClick={() => handleApprove(request)}
                          disabled={isLoading}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(request)}
                          disabled={isLoading}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}