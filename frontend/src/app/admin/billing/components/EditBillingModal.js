'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function EditBillingModal({ isOpen, onClose, billingId, serviceType, onSave }) {
  const [activeTab, setActiveTab] = useState('tenant-info');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [formData, setFormData] = useState({
    amount: 0,
    paymentStatus: 'unpaid',
    dueDate: '',
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

  // Fetch billing details when modal opens
  useEffect(() => {
    if (isOpen && billingId && serviceType) {
      fetchBillingDetails();
    }
  }, [isOpen, billingId, serviceType]);

  const fetchBillingDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/billing/${serviceType}/${billingId}/details`, { skipCache: true });
      
      if (response.success && response.data) {
        setTenantInfo(response.data.tenantInfo);
        setFormData({
          amount: response.data.billingDetails.amount || 0,
          paymentStatus: response.data.billingDetails.paymentStatus || 'unpaid',
          dueDate: response.data.billingDetails.dueDate || '',
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
      const response = await api.put(`/api/admin/billing/${serviceType}/${billingId}/details`, formData);
      
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
        .modal-enter {
          animation: slideInUp 0.3s ease-out;
        }
        .tab-content-enter {
          animation: fadeInScale 0.2s ease-out;
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Edit Billing</h2>
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
            <div className="tab-content-enter">
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

                  {(tenantInfo.room || tenantInfo.desk || tenantInfo.position) && (
                    <div className="grid grid-cols-2 gap-4">
                      {tenantInfo.room && (
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                          <label className="block text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Office/Room</label>
                          <p className="text-sm font-semibold text-teal-900">{tenantInfo.room}</p>
                        </div>
                      )}
                      {tenantInfo.desk && (
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                          <label className="block text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Desk</label>
                          <p className="text-sm font-semibold text-teal-900">{tenantInfo.desk}</p>
                        </div>
                      )}
                      {tenantInfo.position && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                          <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Position</label>
                          <p className="text-sm font-semibold text-blue-900">{tenantInfo.position}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Billing Details Tab */}
              {activeTab === 'billing-details' && (
                <div className="space-y-5">
                  {/* Row 1: Type and Desk/Office */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                      <div className="px-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 bg-gray-50">
                        <p className="font-semibold">
                          {serviceType === 'private-office' ? 'Private Office' : serviceType === 'virtual-office' ? 'Virtual Office' : 'Dedicated Desk'}
                        </p>
                      </div>
                    </div>
                    {serviceType === 'dedicated-desk' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Desk</label>
                        <div className="px-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 bg-gray-50">
                          <p className="font-semibold">{tenantInfo?.desk || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {serviceType === 'private-office' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Office Name</label>
                        <div className="px-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 bg-gray-50">
                          <p className="font-semibold">{tenantInfo?.room || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {serviceType === 'virtual-office' && (
                      <div></div>
                    )}
                  </div>

                  {/* Row 2: Amount and Fee Period */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₱)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Fee Period</label>
                      <input
                        type="text"
                        value={formData.rentFeePeriod}
                        onChange={(e) => setFormData({ ...formData, rentFeePeriod: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                        placeholder="e.g., Monthly"
                      />
                    </div>
                  </div>

                  {/* Row 3: CUSA Fee and Parking Fee */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">CUSA Fee (₱)</label>
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

                  {/* Payment Status and Due Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                      <select
                        value={formData.paymentStatus}
                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                      />
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
                    {/* Type and Desk/Office */}
                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <span className="text-gray-700 font-semibold">Type</span>
                      <span className="text-teal-700 font-semibold">
                        {serviceType === 'private-office' ? 'Private Office' : serviceType === 'virtual-office' ? 'Virtual Office' : 'Dedicated Desk'}
                        {serviceType === 'dedicated-desk' && ` - Desk ${tenantInfo?.desk}`}
                        {serviceType === 'private-office' && ` - ${tenantInfo?.room}`}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <span className="text-gray-700 font-semibold">Amount</span>
                      <span className="text-3xl font-bold text-teal-700">₱{formData.amount.toLocaleString()}</span>
                    </div>

                    {/* Fee Period */}
                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <span className="text-gray-700 font-semibold">Fee Period</span>
                      <span className="text-slate-800 font-medium">{formData.rentFeePeriod}</span>
                    </div>

                    {/* CUSA Fee */}
                    {formData.cusaFee > 0 && (
                      <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                        <span className="text-gray-700 font-semibold">CUSA Fee</span>
                        <span className="text-slate-800 font-medium">₱{formData.cusaFee.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Parking Fee */}
                    {formData.parkingFee > 0 && (
                      <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                        <span className="text-gray-700 font-semibold">Parking Fee</span>
                        <span className="text-slate-800 font-medium">₱{formData.parkingFee.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-gray-700 font-bold text-lg">Total</span>
                      <span className="text-3xl font-bold text-teal-700">₱{(formData.amount + formData.cusaFee + formData.parkingFee).toLocaleString()}</span>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center justify-between pt-4 border-t border-teal-200">
                      <span className="text-gray-700 font-semibold">Payment Status</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        formData.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : formData.paymentStatus === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : formData.paymentStatus === 'partial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {formData.paymentStatus.charAt(0).toUpperCase() + formData.paymentStatus.slice(1)}
                      </span>
                    </div>

                    {/* Due Date */}
                    {formData.dueDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">Due Date</span>
                        <span className="text-slate-800 font-medium">{new Date(formData.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
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

        {/* Footer */}
        {/* Removed - Save button moved to header */}
      </div>
    </div>,
    document.body
  );
}
