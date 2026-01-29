'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function BillsListModal({ isOpen, onClose, bill, onBillClick }) {
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
      
      // Add isVirtualOffice query parameter if this is a virtual office client
      const queryParam = bill.isVirtualOffice ? '?isVirtualOffice=true' : '';
      const response = await api.get(`/api/admin/billing/user/${bill.userId}/bills${queryParam}`);
      
      if (response.success) {
        // Filter bills to only show bills for the same assignedResource
        const filteredBills = (response.data || []).filter(billItem => {
          const billResource = billItem.assignedResource || billItem.desk || billItem.room || billItem.office;
          const currentResource = bill.assignedResource;
          return billResource === currentResource;
        });
        setBills(filteredBills);
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
      'paid': 'bg-green-100 text-green-700 border-green-300',
      'unpaid': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'overdue': 'bg-red-100 text-red-700 border-red-300'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Bills List</h3>
              <p className="text-sm text-gray-600 mt-1">
                Client: <span className="font-semibold">{bill?.name}</span> | 
                Service: <span className="font-semibold">{bill?.serviceType}</span> | 
                Assigned: <span className="font-semibold">{bill?.assignedResource}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
            <div className="grid grid-cols-1 gap-3">
              {bills.map((billItem) => {
                const dueDate = billItem.dueDate ? new Date(billItem.dueDate) : null;
                const isValidDate = dueDate && !isNaN(dueDate.getTime());
                const totalAmount = (billItem.amount || 0) + (billItem.cusaFee || 0) + (billItem.parkingFee || 0) + (billItem.lateFee || 0) + (billItem.damageFee || 0);
                
                return (
                  <button
                    key={billItem.id}
                    onClick={() => onBillClick(billItem)}
                    className={`border-2 rounded-xl p-4 text-left hover:shadow-lg transition-all ${getStatusColor(billItem.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wide">
                        {billItem.status}
                      </span>
                      <span className="text-lg font-bold text-slate-800">
                        ₱{totalAmount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">
                        Due: {isValidDate 
                          ? dueDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'
                        }
                      </p>
                      <p className="text-xs text-gray-600">
                        Period: {billItem.feePeriod || 'N/A'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
