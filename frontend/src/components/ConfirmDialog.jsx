'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { League_Spartan, Roboto } from 'next/font/google';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
});

export default function ConfirmDialog({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = 'Confirm Action',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmColor = '#0F766E',
  type = 'warning' // 'warning', 'danger', 'info'
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const iconColor = type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6';
  const bgColor = type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : 'bg-blue-50';
  const borderColor = type === 'danger' ? 'border-red-200' : type === 'warning' ? 'border-amber-200' : 'border-blue-200';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 ${borderColor} overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with icon */}
              <div className={`${bgColor} px-6 py-6 text-center border-b ${borderColor}`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white mb-3 shadow-md"
                >
                  {type === 'danger' ? (
                    <svg className="w-7 h-7" fill="none" stroke={iconColor} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : type === 'warning' ? (
                    <svg className="w-7 h-7" fill="none" stroke={iconColor} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7" fill="none" stroke={iconColor} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </motion.div>
                <h3 className={`${leagueSpartan.className} text-xl font-bold ${type === 'danger' ? 'text-red-800' : type === 'warning' ? 'text-amber-800' : 'text-blue-800'}`}>
                  {title}
                </h3>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <p className={`${roboto.className} text-base text-slate-700 text-center leading-relaxed mb-6`}>
                  {message}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    className={`${roboto.className} px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200`}
                  >
                    {cancelText}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirm}
                    className={`${roboto.className} px-6 py-2.5 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg`}
                    style={{ backgroundColor: confirmColor }}
                    onMouseEnter={(e) => {
                      const darker = confirmColor === '#0F766E' ? '#0d6b64' : confirmColor;
                      e.target.style.backgroundColor = darker;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = confirmColor;
                    }}
                  >
                    {confirmText}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
