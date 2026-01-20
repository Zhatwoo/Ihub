'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function RequestList() {
  const [schedules, setSchedules] = useState([]);

  // Fetch schedules from API
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await api.get('/api/admin/private-office/requests');
        if (response.success && response.data) {
          setSchedules(response.data.requests || []);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setSchedules([]);
      }
    };
    fetchSchedules();
  }, []);

  const handleApprove = async (id) => {
    try {
      const response = await api.put(`/api/admin/private-office/requests/${id}/status`, { 
        status: 'approved' 
      });
      if (response.success) {
        // Refresh schedules
        const schedulesResponse = await api.get('/api/admin/private-office/requests');
        if (schedulesResponse.success && schedulesResponse.data) {
          setSchedules(schedulesResponse.data.requests || []);
        }
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await api.put(`/api/admin/private-office/requests/${id}/status`, { 
        status: 'rejected' 
      });
      if (response.success) {
        // Refresh schedules
        const schedulesResponse = await api.get('/api/admin/private-office/requests');
        if (schedulesResponse.success && schedulesResponse.data) {
          setSchedules(schedulesResponse.data.requests || []);
        }
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 animate-fadeIn">
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
                        {request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <p className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                        <button 
                          onClick={() => handleApprove(request.id)} 
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(request.id)} 
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
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