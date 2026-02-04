'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import BillPDFPreviewModal from './BillPDFPreviewModal';

export default function BillsListModal({ isOpen, onClose, bill, onBillClick }) {
  const [mounted, setMounted] = useState(false);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [selectedBillForPDF, setSelectedBillForPDF] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);

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
      const response = await api.get(`/api/admin/billing/user/${bill.userId}/bills${queryParam}`, { skipCache: true });
      
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

  const handleExportPDF = (billItem, e) => {
    e.stopPropagation(); // Prevent triggering the bill click
    setSelectedBillForPDF(billItem);
    setPdfPreviewOpen(true);
  };

  const handleExportAll = async () => {
    try {
      setExportingAll(true);
      
      const billIds = bills.map(b => b.id);
      
      console.log('[BillsListModal] Exporting bills:', { userId: bill.userId, billIds, isVirtualOffice: bill.isVirtualOffice });
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/billing/export-multiple-bills-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: bill.userId,
          billIds,
          isVirtualOffice: bill.isVirtualOffice || false
        }),
      });

      console.log('[BillsListModal] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BillsListModal] Error response:', errorText);
        throw new Error(`Failed to generate PDF (${response.status})`);
      }

      const blob = await response.blob();
      console.log('[BillsListModal] Blob size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bills-${bill.userId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('[BillsListModal] Export successful');
    } catch (err) {
      console.error('[BillsListModal] Error exporting all bills:', err);
      alert('Failed to export bills. Please try again.');
    } finally {
      setExportingAll(false);
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
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Bills List</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>
                  <span className="font-medium text-gray-700">Client:</span> <span className="font-semibold text-slate-800">{bill?.name}</span>
                </span>
                <span className="text-gray-400">|</span>
                <span>
                  <span className="font-medium text-gray-700">Service:</span> <span className="font-semibold text-slate-800">{bill?.serviceType}</span>
                </span>
                <span className="text-gray-400">|</span>
                <span>
                  <span className="font-medium text-gray-700">Assigned:</span> <span className="font-semibold text-slate-800">{bill?.assignedResource}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleExportAll}
                disabled={bills.length === 0 || exportingAll}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl whitespace-nowrap"
                title="Export all bills as PDF"
              >
                {exportingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export All
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                title="Close"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-600 mb-4"></div>
              <p className="text-gray-500 text-lg">Loading bills...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-600 text-center font-semibold">{error}</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg font-semibold">No bills found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bills.map((billItem) => {
                const dueDate = billItem.dueDate ? new Date(billItem.dueDate) : null;
                const isValidDate = dueDate && !isNaN(dueDate.getTime());
                const totalAmount = (billItem.amount || 0) + (billItem.cusaFee || 0) + (billItem.parkingFee || 0) + (billItem.lateFee || 0) + (billItem.damageFee || 0);
                
                return (
                  <div
                    key={billItem.id}
                    className={`border-2 rounded-xl p-5 hover:shadow-xl transition-all ${getStatusColor(billItem.status)}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => onBillClick(billItem)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/50">
                            {billItem.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-700">
                            <span className="text-gray-600">Due:</span> {isValidDate 
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
                            <span className="font-medium">Period:</span> {billItem.feePeriod || 'N/A'}
                          </p>
                        </div>
                      </button>
                      
                      <div className="flex flex-col items-center gap-3 flex-shrink-0">
                        <span className="text-2xl font-bold text-slate-800 whitespace-nowrap">
                          ₱{totalAmount.toLocaleString()}
                        </span>
                        <button
                          onClick={(e) => handleExportPDF(billItem, e)}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg"
                          title="Export this bill as PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <BillPDFPreviewModal
        isOpen={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        bill={selectedBillForPDF}
        userId={bill?.userId}
        isVirtualOffice={bill?.isVirtualOffice}
      />
    </>
  );

  return createPortal(modalContent, document.body);
}
