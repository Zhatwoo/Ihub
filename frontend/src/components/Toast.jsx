'use client';

import { useEffect, useState } from 'react';

// Toast context for global toast notifications
let toastListeners = [];

export const showToast = (message, type = 'success', duration = 4000) => {
  if (typeof window === 'undefined') return;
  toastListeners.forEach(listener => listener({ message, type, duration }));
};

export default function Toast() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', duration: 4000 });

  useEffect(() => {
    const listener = (newToast) => {
      setToast({ ...newToast, show: true });
      const timeout = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, newToast.duration || 4000);
      
      // Store timeout ID for cleanup
      return () => clearTimeout(timeout);
    };

    toastListeners.push(listener);

    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  if (!toast.show) return null;

  const bgColor = toast.type === 'success' 
    ? 'bg-green-500' 
    : toast.type === 'error' 
    ? 'bg-red-500' 
    : 'bg-blue-500';

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px]`}>
        <div className="flex-1">
          <p className="font-medium">{toast.message}</p>
        </div>
        <button
          onClick={() => setToast(prev => ({ ...prev, show: false }))}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
