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

export default function ConfirmationModal({ isOpen, onClose, type = 'success', title, message }) {
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
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const iconColor = isSuccess ? '#10b981' : '#ef4444';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
              <div className={`${bgColor} px-6 py-8 text-center`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4 shadow-lg"
                >
                  {isSuccess ? (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke={iconColor}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke={iconColor}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </motion.div>
                <h3 className={`${leagueSpartan.className} text-2xl font-bold ${isSuccess ? 'text-green-800' : 'text-red-800'} mb-2`}>
                  {title || (isSuccess ? 'Success!' : 'Error')}
                </h3>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <p className={`${roboto.className} text-base text-slate-700 text-center leading-relaxed mb-6`}>
                  {message}
                </p>

                {/* Close Button */}
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className={`${leagueSpartan.className} px-8 py-3 ${isSuccess ? 'bg-[#0F766E] hover:bg-[#0d6b64]' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg`}
                  >
                    {isSuccess ? 'Got it!' : 'Try Again'}
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
