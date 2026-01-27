'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function EditBillModal({ isOpen, onClose, bill, onSave }) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    cusaFee: 0,
    parkingFee: 0,
    feePeriod: 'Monthly',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (bill) {
      const initialFeePeriod = bill.feePeriod && bill.feePeriod !== 'N/A' ? bill.feePeriod : 'Monthly';
      
      setFormData({
        amount: bill.amount || 0,
        cusaFee: bill.cusaFee || 0,
        parkingFee: bill.parkingFee || 0,
        feePeriod: initialFeePeriod,
        dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString() : ''
      });

      // If dueDate is not set or invalid, calculate it based on feePeriod
      if (!bill.dueDate || bill.dueDate === 'Invalid Date') {
        // Trigger calculation with the initial fee period
        setTimeout(() => handleFeePeriodChange(initialFeePeriod), 0);
      }
    }
  }, [bill]);

  // Auto-calculate due date when fee period changes
  const handleFeePeriodChange = (newFeePeriod) => {
    console.log('[EditBillModal] handleFeePeriodChange called with:', newFeePeriod);
    console.log('[EditBillModal] Current bill:', bill);
    console.log('[EditBillModal] bill.startDate:', bill?.startDate);
    
    setFormData(prev => {
      const updated = { ...prev, feePeriod: newFeePeriod };
      
      // Calculate due date based on start date + fee period
      if (bill?.startDate) {
        const startDate = new Date(bill.startDate);
        console.log('[EditBillModal] Parsed start date:', startDate);
        console.log('[EditBillModal] Start date valid?', !isNaN(startDate.getTime()));
        
        if (isNaN(startDate.getTime())) {
          console.error('[EditBillModal] Invalid start date!');
          return updated;
        }
        
        const dueDate = new Date(startDate);
        
        switch (newFeePeriod) {
          case '5 minutes':
            dueDate.setMinutes(dueDate.getMinutes() + 5);
            break;
          case 'Monthly':
            dueDate.setDate(dueDate.getDate() + 30);
            break;
          case 'Quarterly':
            dueDate.setDate(dueDate.getDate() + 90);
            break;
          case 'Semiannually':
            dueDate.setDate(dueDate.getDate() + 180);
            break;
          case 'Annually':
            dueDate.setDate(dueDate.getDate() + 365);
            break;
          default:
            dueDate.setDate(dueDate.getDate() + 30);
        }
        
        console.log('[EditBillModal] Calculated due date:', dueDate);
        console.log('[EditBillModal] Due date ISO:', dueDate.toISOString());
        
        // Store the full ISO string to preserve time information
        updated.dueDate = dueDate.toISOString();
      } else {
        console.error('[EditBillModal] No start date available!');
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate that dueDate was calculated
    if (!formData.dueDate) {
      setError('Please select a fee period to calculate the due date');
      setLoading(false);
      return;
    }

    // Prepare the data to send
    const dataToSend = {
      amount: parseFloat(formData.amount) || 0,
      cusaFee: parseFloat(formData.cusaFee) || 0,
      parkingFee: parseFloat(formData.parkingFee) || 0,
      feePeriod: formData.feePeriod,
      dueDate: formData.dueDate
    };

    console.log('[EditBillModal] Submitting form data:', dataToSend);
    console.log('[EditBillModal] feePeriod:', dataToSend.feePeriod);
    console.log('[EditBillModal] dueDate:', dataToSend.dueDate);
    console.log('[EditBillModal] dueDate as Date:', new Date(dataToSend.dueDate));

    try {
      const response = await api.put(
        `/api/admin/billing/${bill.userId}/${bill.billId}/update`,
        dataToSend
      );

      console.log('[EditBillModal] Response:', response);

      if (response.success) {
        onSave();
        onClose();
      } else {
        setError(response.message || 'Failed to update bill');
      }
    } catch (err) {
      console.error('[EditBillModal] Error:', err);
      setError(err.message || 'Failed to update bill');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-2xl font-bold text-slate-800">Edit Bill</h3>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="edit-bill-form"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form id="edit-bill-form" onSubmit={handleSubmit}>
            {/* Tenant Details Section */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Tenant Details</h4>
              
              {/* Row 1: Client Name, Email */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Client Name</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {bill?.name || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 truncate" title={bill?.email}>
                    {bill?.email || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Row 2: Company, Contact */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {bill?.companyName || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contact</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {bill?.phone || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Row 3: Service, Assigned */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Service</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {bill?.serviceType || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {bill?.assignedResource || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Information Section */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Bill Information</h4>
              
              {/* Row 1: Rent, Fee Period */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rent Amount (₱)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fee Period</label>
                  <select
                    value={formData.feePeriod}
                    onChange={(e) => handleFeePeriodChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-600"
                  >
                    <option value="5 minutes">5 minutes (testing)</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly (3 months)</option>
                    <option value="Semiannually">Semiannually (6 months)</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
              </div>

              {/* Row 2: CUSA Fee, Parking Fee */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">CUSA Fee (₱)</label>
                  <input
                    type="number"
                    value={formData.cusaFee}
                    onChange={(e) => setFormData({ ...formData, cusaFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Parking Fee (₱)</label>
                  <input
                    type="number"
                    value={formData.parkingFee}
                    onChange={(e) => setFormData({ ...formData, parkingFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Due Date - Auto-calculated, Read-only */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date (Auto-calculated)</label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700">
                  {formData.dueDate ? new Date(formData.dueDate).toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }) : 'Select a fee period to calculate'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Due date is automatically calculated as: Start Date + Fee Period
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-lg font-bold text-slate-800">
                Total: ₱{(formData.amount + formData.cusaFee + formData.parkingFee).toLocaleString()}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
