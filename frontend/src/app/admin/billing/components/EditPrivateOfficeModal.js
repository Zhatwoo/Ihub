'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function EditPrivateOfficeModal({ isOpen, onClose, billingId, onSave }) {
  const [activeTab, setActiveTab] = useState('tenant-info');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [formData, setFormData] = useState({
    notes: '',
    rentFee: 0,
    rentFeePeriod: 'Monthly',
    cusaFee: 0,
    parkingFee: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && billingId) {
      fetchBillingDetails();
    }
  }, [isOpen, billingId]);

  const fetchBillingDetails = async () => {
    try {
      setLoading(true);
      // Retrieve userId from sessionStorage if available (for new path records)
      const userId = sessionStorage.getItem(`billing_userId_${billingId}`);
      console.log(`Fetching billing details for billingId: ${billingId}, userId: ${userId || 'not found'}`);
      
      const url = userId 
        ? `/api/admin/billing/private-office/${billingId}/details?userId=${userId}`
        : `/api/admin/billing/private-office/${billingId}/details`;
      
      console.log(`API URL: ${url}`);
      const response = await api.get(url, { skipCache: true });
      
      if (response.success && response.data) {
        setTenantInfo(response.data.tenantInfo);
        setFormData({
          notes: response.data.billingDetails.notes || '',
          rentFee: response.data.billingDetails.rentFee || 0,
          rentFeePeriod: response.data.billingDetails.rentFeePeriod || 'Monthly',
          cusaFee: response.data.billingDetails.cusaFee || 0,
          parkingFee: response.data.billingDetails.parkingFee || 0
        });
      }
    } catch (error) {
      console.error('Error fetching billing details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await api.put(`/api/admin/billing/private-office/${billingId}/details`, formData);
      
      if (response.success) {
        onSave?.();
        onClose();
      }
    } catch (error) {
      console.error('Error saving billing details:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-20px);
          }
        }
        .modal-enter {
          animation: slideInUp 0.3s ease-out;
        }
        .tab-content-enter {
          animation: slideInRight 0.3s ease-out;
        }
        .tab-content-exit {
          animation: slideOutLeft 0.2s ease-in;
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Edit Billing - Private Office</h2>
            <p className="text-sm text-gray-500 mt-1">Manage billing information and details</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('tenant-info')}
            className={`px-4 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'tenant-info'
                ? 'text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tenant Information
            {activeTab === 'tenant-info' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('billing-details')}
            className={`px-4 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'billing-details'
                ? 'text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Billing Details
            {activeTab === 'billing-details' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('billing-preview')}
            className={`px-4 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'billing-preview'
                ? 'text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Billing Preview
            {activeTab === 'billing-preview' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div key={activeTab} className="tab-content-enter">
              {/* Tenant Information Tab */}
              {activeTab === 'tenant-info' && tenantInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Client Name</label>
                      <p className="text-lg font-bold text-slate-800">{tenantInfo.clientName}</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Email</label>
                      <p className="text-sm text-slate-800 truncate" title={tenantInfo.email || 'N/A'}>{tenantInfo.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Contact Number</label>
                      <p className="text-sm text-slate-800">{tenantInfo.contactNumber || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Company</label>
                      <p className="text-sm text-slate-800 truncate" title={tenantInfo.companyName || 'N/A'}>{tenantInfo.companyName || 'N/A'}</p>
                    </div>
                  </div>

                  {tenantInfo.room && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                      <label className="block text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Office/Room</label>
                      <p className="text-sm font-semibold text-teal-900">{tenantInfo.room}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Billing Details Tab */}
              {activeTab === 'billing-details' && (
                <div className="space-y-5">
                  {/* Row 1: Type and Office */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                      <div className="px-4 py-3 border-2 border-gray-300 rounded-xl text-slate-900 bg-gray-200">
                        <p className="font-semibold">Private Office</p>
                      </div>
                    </div>
                    {tenantInfo?.room && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Office Name</label>
                        <div className="px-4 py-3 border-2 border-gray-300 rounded-xl text-slate-900 bg-gray-200">
                          <p className="font-semibold">{tenantInfo.room}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Amount and Fee Period (Uneditable) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₱)</label>
                      <div className="px-4 py-3 border-2 border-gray-300 rounded-xl text-slate-900 bg-gray-200">
                        <p className="font-semibold">₱{formData.rentFee.toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Fee Period</label>
                      <div className="px-4 py-3 border-2 border-gray-300 rounded-xl text-slate-900 bg-gray-200">
                        <p className="font-semibold">{formData.rentFeePeriod}</p>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: CUSA Fee and Parking Fee */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-semibold text-gray-700">CUSA Fee (₱)</label>
                        <div className="group relative">
                          <button
                            type="button"
                            className="w-5 h-5 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold hover:bg-gray-400 transition-colors"
                            title="Common Use Service Area"
                          >
                            ?
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                            <div className="bg-slate-800 text-white text-xs rounded-lg p-3 w-48 shadow-lg">
                              <p className="font-bold mb-1">Common Use Service Area</p>
                              <p>It is an additional fee tenants pay on top of their base rental cost to cover the maintenance and operational expenses of a building's shared or common areas</p>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                        <input
                          type="number"
                          value={formData.cusaFee}
                          onChange={(e) => setFormData({ ...formData, cusaFee: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Parking Fee (₱)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                        <input
                          type="number"
                          value={formData.parkingFee}
                          onChange={(e) => setFormData({ ...formData, parkingFee: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all resize-none"
                      rows="4"
                      placeholder="Add any notes about this billing..."
                    />
                  </div>
                </div>
              )}

              {/* Billing Preview Tab */}
              {activeTab === 'billing-preview' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <span className="text-gray-700 font-semibold">Type</span>
                      <span className="text-teal-700 font-semibold">Private Office - {tenantInfo?.room}</span>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <span className="text-gray-700 font-semibold">Amount</span>
                      <span className="text-3xl font-bold text-teal-700">₱{formData.rentFee.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <span className="text-gray-700 font-semibold">Fee Period</span>
                      <span className="text-slate-800 font-medium">{formData.rentFeePeriod}</span>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <span className="text-gray-700 font-semibold">CUSA Fee</span>
                      <span className="text-slate-800 font-medium">₱{formData.cusaFee.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <span className="text-gray-700 font-semibold">Parking Fee</span>
                      <span className="text-slate-800 font-medium">₱{formData.parkingFee.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-gray-700 font-bold text-lg">Total</span>
                      <span className="text-3xl font-bold text-teal-700">₱{(formData.rentFee + formData.cusaFee + formData.parkingFee).toLocaleString()}</span>
                    </div>
                  </div>

                  {formData.notes && (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Notes</h4>
                      <p className="text-blue-800 text-sm leading-relaxed">{formData.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
