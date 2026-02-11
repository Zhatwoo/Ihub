'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function BillsHistoryModal({ isOpen, onClose, bill }) {
  const [mounted, setMounted] = useState(false);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && bill?.userId) {
      fetchBills();
    }
  }, [isOpen, bill]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/api/admin/billing/user/${bill.userId}/bills`);
      
      if (response.success) {
        setBills(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch bills');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const getStatusColor = (status) => {
    const colorMap = {
      'paid': 'bg-green-100 text-green-700',
      'unpaid': 'bg-yellow-100 text-yellow-700',
      'overdue': 'bg-red-100 text-red-700'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-slate-800">Bills History</h3>
          <p className="text-sm text-gray-600 mt-1">
            Client: <span className="font-semibold">{bill?.name}</span> | 
            Service: <span className="font-semibold">{bill?.serviceType}</span> | 
            Assigned: <span className="font-semibold">{bill?.assignedResource}</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mb-4"></div>
              <p className="text-gray-500">Loading bills...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-500">No bills found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((billItem) => {
                const totalAmount = (billItem.amount || 0) + (billItem.cusaFee || 0) + (billItem.parkingFee || 0) + (billItem.lateFee || 0) + (billItem.damageFee || 0);
                
                return (
                  <div key={billItem.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Bill Period</p>
                        <p className="font-semibold text-slate-800">
                          {(() => {
                            const startDate = billItem.startDate ? new Date(billItem.startDate) : null;
                            const dueDate = billItem.dueDate ? new Date(billItem.dueDate) : null;
                            const startValid = startDate && !isNaN(startDate.getTime());
                            const dueValid = dueDate && !isNaN(dueDate.getTime());
                            
                            const startStr = startValid 
                              ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'N/A';
                            const dueStr = dueValid 
                              ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'N/A';
                            
                            return `${startStr} - ${dueStr}`;
                          })()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(billItem.status)}`}>
                        {billItem.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Rent</p>
                        <p className="font-semibold text-sm">₱{(billItem.amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">CUSA Fee</p>
                        <p className="font-semibold text-sm">₱{(billItem.cusaFee || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Parking Fee</p>
                        <p className="font-semibold text-sm">₱{(billItem.parkingFee || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fee Period</p>
                        <p className="font-semibold text-sm">{billItem.feePeriod || 'N/A'}</p>
                      </div>
                      {(billItem.lateFee > 0 || billItem.damageFee > 0) && (
                        <>
                          {billItem.lateFee > 0 && (
                            <div>
                              <p className="text-xs text-gray-500">Late Fee</p>
                              <p className="font-semibold text-sm text-red-600">₱{billItem.lateFee.toLocaleString()}</p>
                            </div>
                          )}
                          {billItem.damageFee > 0 && (
                            <div>
                              <p className="text-xs text-gray-500">Damage Fee</p>
                              <p className="font-semibold text-sm text-red-600">₱{billItem.damageFee.toLocaleString()}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="text-lg font-bold text-slate-800">₱{totalAmount.toLocaleString()}</p>
                      </div>
                      {billItem.paidAt && (() => {
                        const paidDate = new Date(billItem.paidAt);
                        const isValidDate = !isNaN(paidDate.getTime());
                        
                        return isValidDate ? (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Paid On</p>
                            <p className="text-sm font-semibold text-green-600">
                              {paidDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
