'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function BillDetailModal({ isOpen, onClose, bill }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !bill) return null;

  const getStatusColor = (status) => {
    const colorMap = {
      'paid': 'bg-green-100 text-green-700',
      'unpaid': 'bg-yellow-100 text-yellow-700',
      'overdue': 'bg-red-100 text-red-700'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalAmount = (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0) + (bill.lateFee || 0) + (bill.damageFee || 0);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-800">Bill Details</h3>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(bill.status)}`}>
                {bill.status}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Two Column Layout - Left: Info Stack, Right: Charges */}
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
            {/* LEFT COLUMN - Stacked Info Cards */}
            <div className="space-y-4">
              {/* Client Information */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-bold text-gray-700 mb-1.5 uppercase">Client Information</h4>
                <div className="space-y-0.5 text-sm">
                  <p><span className="text-gray-600">Name:</span> <span className="font-semibold">{bill.clientName || 'N/A'}</span></p>
                  <p><span className="text-gray-600">Company:</span> <span className="font-semibold">{bill.companyName || 'N/A'}</span></p>
                  <p><span className="text-gray-600">Email:</span> <span className="font-semibold">{bill.email || 'N/A'}</span></p>
                  <p><span className="text-gray-600">Contact:</span> <span className="font-semibold">{bill.contactNumber || 'N/A'}</span></p>
                </div>
              </div>

              {/* Service Information */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-xs font-bold text-gray-700 mb-1.5 uppercase">Service Information</h4>
                <div className="space-y-0.5 text-sm">
                  <p><span className="text-gray-600">Service Type:</span> <span className="font-semibold">{bill.serviceType || 'N/A'}</span></p>
                  <p><span className="text-gray-600">Assigned Resource:</span> <span className="font-semibold">{bill.assignedResource || 'N/A'}</span></p>
                  <p><span className="text-gray-600">Fee Period:</span> <span className="font-semibold">{bill.feePeriod || 'N/A'}</span></p>
                  <p><span className="text-gray-600">Payment Method:</span> <span className="font-semibold">{bill.paymentMethod || 'N/A'}</span></p>
                </div>
              </div>

              {/* Billing Period */}
              <div className="p-3 bg-teal-50 rounded-lg">
                <h4 className="text-xs font-bold text-gray-700 mb-1.5 uppercase">Billing Period</h4>
                <div className="space-y-0.5 text-sm">
                  <p><span className="text-gray-600">Start Date:</span> <span className="font-semibold">{formatDate(bill.startDate)}</span></p>
                  <p><span className="text-gray-600">Due Date:</span> <span className="font-semibold">{formatDate(bill.dueDate)}</span></p>
                  <p>
                    <span className="text-gray-600">Paid On:</span>{' '}
                    <span className={`font-semibold ${bill.paidAt ? 'text-green-600' : 'text-gray-500'}`}>
                      {formatDate(bill.paidAt)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Charges Breakdown */}
            <div className="p-5 bg-purple-50 rounded-lg h-full flex flex-col">
              <h4 className="text-base font-bold text-gray-700 mb-4 uppercase">Charges Breakdown</h4>
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Rent Amount:</span>
                    <span className="font-semibold">₱{(bill.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">CUSA Fee:</span>
                    <span className="font-semibold">₱{(bill.cusaFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Parking Fee:</span>
                    <span className="font-semibold">₱{(bill.parkingFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Late Fee:</span>
                    <span className={`font-semibold ${(bill.lateFee || 0) > 0 ? 'text-red-600' : ''}`}>₱{(bill.lateFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Damage Fee:</span>
                    <span className={`font-semibold ${(bill.damageFee || 0) > 0 ? 'text-red-600' : ''}`}>₱{(bill.damageFee || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-4 border-t-2 border-purple-200 flex justify-between mt-auto">
                  <span className="font-bold text-gray-800 text-xl">Total Amount:</span>
                  <span className="font-bold text-3xl text-slate-800">₱{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
