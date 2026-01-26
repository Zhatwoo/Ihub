'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PaymentModal({ isOpen, onClose, billingData }) {
  const [mounted, setMounted] = useState(false);
  const [lateFee, setLateFee] = useState(0);
  const [damageFee, setDamageFee] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLateFee(0);
      setDamageFee(0);
    }
  }, [isOpen]);

  if (!mounted || !isOpen || !billingData) return null;

  const amount = billingData.amount || 0;
  const cusaFee = billingData.cusaFee || 0;
  const parkingFee = billingData.parkingFee || 0;
  const subtotal = amount + cusaFee + parkingFee;
  const overallTotal = subtotal + lateFee + damageFee;

  const getServiceTypeLabel = () => {
    const typeMap = {
      'private-office': 'Private Office',
      'virtual-office': 'Virtual Office',
      'dedicated-desk': 'Dedicated Desk'
    };
    return typeMap[billingData.type] || billingData.type;
  };

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
        .modal-enter {
          animation: slideInUp 0.3s ease-out;
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Process Payment</h2>
            <p className="text-sm text-gray-500 mt-1">Review and process billing payment</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              Record Payment
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Tenant Information Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Tenant Information</h3>
              <div className="space-y-4">
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Name</label>
                    <p className="text-sm font-semibold text-slate-800">{billingData.clientName || 'N/A'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Email</label>
                    <p className="text-sm text-slate-800 truncate" title={billingData.email || 'N/A'}>{billingData.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Row 2: Type and Office Name/Desk (same row) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Type</label>
                    <div className="px-4 py-3 border-2 border-gray-300 rounded-xl text-slate-900 bg-gray-200">
                      <p className="font-semibold">{getServiceTypeLabel()}</p>
                    </div>
                  </div>

                  {/* Office Name (Private Office only) */}
                  {billingData.type === 'private-office' && billingData.room && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Office Name</label>
                      <div className="px-4 py-3 border-2 border-gray-300 rounded-xl text-slate-900 bg-gray-200">
                        <p className="font-semibold">{billingData.room}</p>
                      </div>
                    </div>
                  )}

                  {/* Desk (Dedicated Desk only) */}
                  {billingData.type === 'dedicated-desk' && billingData.desk && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Desk</label>
                      <div className="px-4 py-3 border-2 border-gray-300 rounded-xl text-slate-900 bg-gray-200">
                        <p className="font-semibold">{billingData.desk}</p>
                      </div>
                    </div>
                  )}

                  {/* Virtual Office - no additional field */}
                  {billingData.type === 'virtual-office' && (
                    <div></div>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Details Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Billing Details</h3>
              <div className="space-y-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                <div className="flex items-center justify-between pb-3 border-b border-teal-200">
                  <span className="text-gray-700 font-semibold">Amount</span>
                  <span className="text-slate-800 font-medium">₱{amount.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-teal-200">
                  <span className="text-gray-700 font-semibold">Due Date</span>
                  <span className="text-slate-800 font-medium">
                    {billingData.dueDate 
                      ? new Date(billingData.dueDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-teal-200">
                  <span className="text-gray-700 font-semibold">CUSA Fee</span>
                  <span className="text-slate-800 font-medium">₱{cusaFee.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-teal-200">
                  <span className="text-gray-700 font-semibold">Parking Fee</span>
                  <span className="text-slate-800 font-medium">₱{parkingFee.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-gray-700 font-bold">Subtotal</span>
                  <span className="text-lg font-bold text-teal-700">₱{subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Additional Fees Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Additional Fees</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Late Fee (₱)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                    <input
                      type="number"
                      value={lateFee}
                      onChange={(e) => setLateFee(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Damage Fee (₱)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                    <input
                      type="number"
                      value={damageFee}
                      onChange={(e) => setDamageFee(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Total Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Overall Total</span>
                <span className="text-4xl font-bold">₱{overallTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-white">
        </div>
      </div>
    </div>,
    document.body
  );
}
