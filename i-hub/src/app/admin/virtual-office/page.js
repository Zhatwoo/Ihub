'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function VirtualOffice() {
  const [clients, setClients] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    position: '',
    phoneNumber: '',
    dateStart: ''
  });

  // Fetch clients from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'virtual-office-clients'), (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
    });
    return () => unsubscribe();
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
        dateStart: formData.dateStart,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'virtual-office-clients'), clientData);
      resetForm();
      setShowFormModal(false);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client. Please try again.');
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
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteDoc(doc(db, 'virtual-office-clients', clientId));
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client. Please try again.');
      }
    }
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

      {showFormModal && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease] p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]">
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Add Client</h2>
              <button 
                onClick={closeFormModal} 
                disabled={loading}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 sm:mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleChange} 
                  placeholder="Enter full name" 
                  required 
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" 
                />
              </div>
              
              <div className="mb-4 sm:mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Company <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="company" 
                  value={formData.company} 
                  onChange={handleChange} 
                  placeholder="Enter company name" 
                  required 
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" 
                />
              </div>
              
              <div className="mb-4 sm:mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Email Address <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Enter email address" 
                  required 
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" 
                />
              </div>
              
              <div className="mb-4 sm:mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Position <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="position" 
                  value={formData.position} 
                  onChange={handleChange} 
                  placeholder="Enter position/title" 
                  required 
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" 
                />
              </div>
              
              <div className="mb-4 sm:mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Phone Number <span className="text-red-500">*</span></label>
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  value={formData.phoneNumber} 
                  onChange={handleChange} 
                  placeholder="Enter phone number" 
                  required 
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" 
                />
              </div>
              
              <div className="mb-4 sm:mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Date Start <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="dateStart" 
                  value={formData.dateStart} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all cursor-pointer" 
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button 
                  type="button" 
                  onClick={closeFormModal} 
                  disabled={loading}
                  className="w-full sm:w-auto px-5 sm:px-7 py-2.5 sm:py-3.5 bg-gray-100 text-gray-600 rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full sm:flex-1 py-2.5 sm:py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-sm sm:text-base font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
