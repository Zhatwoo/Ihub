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
        className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-800">Bill Details</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(bill.status)}`}>
              {bill.status}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Client Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Client Information</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">Name:</span> <span className="font-semibold">{bill.clientName || 'N/A'}</span></p>
              <p><span className="text-gray-600">Company:</span> <span className="font-semibold">{bill.companyName || 'N/A'}</span></p>
              <p><span className="text-gray-600">Email:</span> <span className="font-semibold">{bill.email || 'N/A'}</span></p>
              <p><span className="text-gray-600">Contact:</span> <span className="font-semibold">{bill.contactNumber || 'N/A'}</span></p>
            </div>
          </div>

          {/* Service Information */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Service Information</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">Service Type:</span> <span className="font-semibold">{bill.serviceType || 'N/A'}</span></p>
              <p><span className="text-gray-600">Assigned Resource:</span> <span className="font-semibold">{bill.assignedResource || 'N/A'}</span></p>
              <p><span className="text-gray-600">Fee Period:</span> <span className="font-semibold">{bill.feePeriod || 'N/A'}</span></p>
            </div>
          </div>

          {/* Billing Period */}
          <div className="mb-6 p-4 bg-teal-50 rounded-lg">
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Billing Period</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">Start Date:</span> <span className="font-semibold">{formatDate(bill.startDate)}</span></p>
              <p><span className="text-gray-600">Due Date:</span> <span className="font-semibold">{formatDate(bill.dueDate)}</span></p>
              {bill.paidAt && (
                <p><span className="text-gray-600">Paid On:</span> <span className="font-semibold text-green-600">{formatDate(bill.paidAt)}</span></p>
              )}
            </div>
          </div>

          {/* Charges Breakdown */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Charges Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rent Amount:</span>
                <span className="font-semibold">₱{(bill.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CUSA Fee:</span>
                <span className="font-semibold">₱{(bill.cusaFee || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Parking Fee:</span>
                <span className="font-semibold">₱{(bill.parkingFee || 0).toLocaleString()}</span>
              </div>
              {bill.lateFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Late Fee:</span>
                  <span className="font-semibold text-red-600">₱{bill.lateFee.toLocaleString()}</span>
                </div>
              )}
              {bill.damageFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Damage Fee:</span>
                  <span className="font-semibold text-red-600">₱{bill.damageFee.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t-2 border-purple-200 flex justify-between">
                <span className="font-bold text-gray-800">Total Amount:</span>
                <span className="font-bold text-xl text-slate-800">₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
