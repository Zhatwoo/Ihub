'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function BillPDFPreviewModal({ isOpen, onClose, bill, userId, isVirtualOffice }) {
  const [mounted, setMounted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && bill?.id && userId) {
      loadPDFPreview();
    }
    
    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, bill, userId]);

  const loadPDFPreview = async () => {
    try {
      setLoading(true);
      setError('');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const queryParam = isVirtualOffice ? '?isVirtualOffice=true' : '';
      const url = `${API_URL}/api/admin/billing/${userId}/${bill.id}/export-pdf${queryParam}`;
      console.log('[BillPDFPreviewModal] Fetching PDF from:', url);
      
      const response = await fetch(url);

      console.log('[BillPDFPreviewModal] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BillPDFPreviewModal] Error response:', errorText);
        throw new Error(`Failed to generate PDF preview (${response.status})`);
      }

      const blob = await response.blob();
      console.log('[BillPDFPreviewModal] Blob size:', blob.size);
      const url2 = URL.createObjectURL(blob);
      setPdfUrl(url2);
    } catch (err) {
      console.error('[BillPDFPreviewModal] Error:', err);
      setError(err.message || 'Failed to load PDF preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `bill-${bill.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Bill PDF Preview</h3>
              <p className="text-sm text-gray-600 mt-1">
                Bill ID: <span className="font-semibold">{bill?.id}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!pdfUrl || loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
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
        </div>

        {/* PDF Preview */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Generating PDF preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
                <p className="text-red-600 text-center">{error}</p>
                <button
                  onClick={loadPDFPreview}
                  className="mt-4 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
