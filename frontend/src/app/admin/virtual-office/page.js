'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function VirtualOffice() {
  const [clients, setClients] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleteClientId, setDeleteClientId] = useState(null);
  const clientsIntervalRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    position: '',
    phoneNumber: '',
    dateStart: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch clients from backend
  useEffect(() => {
    const fetchClients = async () => {
      console.log('🔄 POLLING EXECUTED: admin/virtual-office - fetchClients');
      try {
        const response = await api.get('/api/admin/virtual-office/clients');
        if (response.success && response.data) {
          const clientsData = response.data.clients || [];
          setClients(clientsData);
          console.log(`📊 SNAPSHOT: admin/virtual-office - ${clientsData.length} clients loaded`);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
      }
    };

    // Initial fetch only - AUTO REFRESH DISABLED
    console.log('📖 AUTO READ: admin/virtual-office - Initial fetchClients starting...');
    fetchClients();
    
    // DISABLED: Auto refresh/polling - was causing excessive Firestore reads
    // Data will only load once on mount, no automatic refresh
    // const handleVisibilityChange = () => { ... };
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (clientsIntervalRef.current) {
        clearInterval(clientsIntervalRef.current);
        clientsIntervalRef.current = null;
      }
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const clientData = {
        fullName: formData.fullName.trim(),
        company: formData.company.trim(),
        email: formData.email.trim(),
        position: formData.position.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        dateStart: formData.dateStart
      };
      
      const response = await api.post('/api/virtual-office', clientData);
      
      if (response.success) {
        resetForm();
        setShowFormModal(false);
        showToast('Client added successfully!', 'success');
        // Refresh clients list
        const clientsResponse = await api.get('/api/virtual-office');
        if (clientsResponse.success && clientsResponse.data) {
          setClients(clientsResponse.data);
        }
      } else {
        showToast(response.message || 'Failed to save client. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      showToast(error.message || 'Failed to save client. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      company: '',
      email: '',
      position: '',
      phoneNumber: '',
      dateStart: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (!loading) {
      setShowFormModal(false);
      resetForm();
    }
  };

  const handleDelete = async (clientId) => {
    setDeleteClientId(clientId);
    setConfirmAction(() => async () => {
      try {
        const response = await api.delete(`/api/virtual-office/${clientId}`);
        
        if (response.success) {
          showToast('Client deleted successfully!', 'success');
          // Refresh clients list
          const clientsResponse = await api.get('/api/virtual-office');
          if (clientsResponse.success && clientsResponse.data) {
            setClients(clientsResponse.data);
          }
        } else {
          showToast(response.message || 'Failed to delete client. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        showToast(error.message || 'Failed to delete client. Please try again.', 'error');
      }
      setShowConfirmDialog(false);
      setDeleteClientId(null);
    });
    setShowConfirmDialog(true);
  };

  return (
    <div className="w-full animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold animate-slideInLeft">Virtual Office</h1>
        <button 
          onClick={openAddModal} 
          className="w-full sm:w-auto px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40 transition-all whitespace-nowrap"
        >
          + Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 xl:p-6 shadow-lg shadow-slate-800/5 border border-gray-200">
        {clients.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <p className="text-slate-800 font-semibold text-base sm:text-lg">No Clients Added</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Click "Add Client" to add your first virtual office client</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <div className="min-w-full inline-block align-middle">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Full Name</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Company</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Email</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Position</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Phone</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Date Start</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((client) => (
                    <tr key={client.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <p className="text-slate-800 font-semibold text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none" title={client.fullName}>{client.fullName}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none" title={client.company || 'N/A'}>{client.company || 'N/A'}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none" title={client.email || 'N/A'}>{client.email || 'N/A'}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" title={client.position || 'N/A'}>{client.position || 'N/A'}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" title={client.phoneNumber || 'N/A'}>{client.phoneNumber || 'N/A'}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <p className="text-slate-800 font-medium text-xs sm:text-sm whitespace-nowrap">
                          {client.dateStart ? new Date(client.dateStart).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <button 
                            onClick={() => handleDelete(client.id)} 
                            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
                          >
                            Delete
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

      {showFormModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeFormModal}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Add Client</h2>
              <div className="flex items-center gap-2">
                <button type="submit" form="client-form" disabled={loading} className="px-4 py-2 sm:py-2.5 bg-teal-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Adding...' : 'Add Client'}</button>
                <button onClick={closeFormModal} disabled={loading} className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">×</button>
              </div>
            </div>
            <form id="client-form" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Column 1: Name, Email, Phone Number */}
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" required className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" required className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Phone Number <span className="text-red-500">*</span></label>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Enter phone number" required className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
                  </div>
                </div>
                {/* Column 2: Company, Position, Date Start */}
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Company <span className="text-red-500">*</span></label>
                    <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Enter company name" required className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Position <span className="text-red-500">*</span></label>
                    <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="Enter position/title" required className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Date Start <span className="text-red-500">*</span></label>
                    <input type="date" name="dateStart" value={formData.dateStart} onChange={handleChange} required className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toast.show && mounted && createPortal(
        <div className="fixed top-6 right-6 z-[10000] animate-[slideInRight_0.3s_ease]">
          <div className={`px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md ${
            toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
            : toast.type === 'success' ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              toast.type === 'error' ? 'bg-red-400/30' : toast.type === 'success' ? 'bg-teal-400/30' : 'bg-blue-400/30'
            }`}>
              <span className="text-lg font-bold">{toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : 'ℹ'}</span>
            </div>
            <span className="font-medium flex-1 text-sm sm:text-base">{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-2 text-white/80 hover:text-white text-xl font-bold transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20">×</button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] animate-[fadeIn_0.2s_ease] p-4" onClick={() => { setShowConfirmDialog(false); setConfirmAction(null); setDeleteClientId(null); }}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Delete Client</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete this client? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirmDialog(false); setConfirmAction(null); setDeleteClientId(null); }} className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-slate-800 font-medium rounded-xl hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={() => { if (confirmAction) confirmAction(); }} className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
