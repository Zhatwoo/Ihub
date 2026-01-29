'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function PaymentModal({ isOpen, onClose, bill, onPaymentRecorded }) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    lateFee: 0,
    damageFee: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useState(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(
        `/api/admin/billing/${bill.userId}/${bill.billId}/record-payment`,
        {
          ...formData,
          isVirtualOffice: bill.isVirtualOffice || false
        }
      );

      if (response.success) {
        onPaymentRecorded();
        onClose();
      } else {
        setError(response.message || 'Failed to record payment');
      }
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const baseAmount = (bill?.amount || 0) + (bill?.cusaFee || 0) + (bill?.parkingFee || 0);
  const totalAmount = baseAmount + (formData.lateFee || 0) + (formData.damageFee || 0);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-2xl font-bold text-slate-800">Record Payment</h3>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="payment-form"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
              title="Close"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Bill Info */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <p className="text-sm text-gray-600">Client: <span className="font-semibold text-slate-800">{bill?.name}</span></p>
              <p className="text-sm text-gray-600">Service: <span className="font-semibold text-slate-800">{bill?.serviceType}</span></p>
              <p className="text-sm text-gray-600">Assigned: <span className="font-semibold text-slate-800">{bill?.assignedResource}</span></p>
              <p className="text-sm text-gray-600">
                Due Date: <span className="font-semibold text-slate-800">
                  {bill?.dueDate 
                    ? new Date(bill.dueDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'
                  }
                </span>
              </p>
              <p className="text-sm text-gray-600">Status: <span className={`font-semibold ${bill?.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'}`}>{bill?.status}</span></p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form id="payment-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column: Bill Breakdown */}
              <div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                  <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Bill Breakdown</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rent:</span>
                    <span className="font-semibold">₱{(bill?.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CUSA Fee:</span>
                    <span className="font-semibold">₱{(bill?.cusaFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Parking Fee:</span>
                    <span className="font-semibold">₱{(bill?.parkingFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-700">Base Amount:</span>
                    <span className="font-bold text-slate-800">₱{baseAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Additional Fees */}
              <div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Additional Fees</h4>
                  
                  {/* Late Fee */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Late Fee (₱)
                    </label>
                    <input
                      type="number"
                      value={formData.lateFee}
                      onChange={(e) => setFormData({ ...formData, lateFee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-400"
                      min="0"
                    />
                  </div>

                  {/* Damage Fee */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Damage Fee (₱)
                    </label>
                    <input
                      type="number"
                      value={formData.damageFee}
                      onChange={(e) => setFormData({ ...formData, damageFee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-400"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-lg font-bold text-slate-800">
                Total Payment: ₱{totalAmount.toLocaleString()}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
