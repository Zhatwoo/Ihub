'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function LoginModal({ isOpen, onClose, onSwitchToSignUp }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized. Please check your environment variables.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Check user role and redirect accordingly
      let redirectPath = '/client/home'; // Default to client home
      
      if (db) {
        try {
          // Check in /accounts/client/users/{userId} first (for clients)
          const clientDoc = await getDoc(doc(collection(db, 'accounts', 'client', 'users'), userCredential.user.uid));
          if (clientDoc.exists()) {
            const userData = clientDoc.data();
            // Redirect based on role: admin -> /admin, client -> /client/home
            if (userData.role === 'admin') {
              redirectPath = '/admin';
            } else {
              redirectPath = '/client/home';
            }
          } else {
            // Check in /accounts/admin/users/{userId} for admin users
            const adminDoc = await getDoc(doc(collection(db, 'accounts', 'admin', 'users'), userCredential.user.uid));
            if (adminDoc.exists()) {
              redirectPath = '/admin';
            }
            // If neither exists, default to client home
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // If error, default to client home
        }
      }
      
      // Success - close modal and redirect based on role
      onClose();
      router.push(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'An error occurred during login. Please try again.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg border-4 border-[#0F766E] p-8 w-full max-w-md shadow-2xl"
            >
              {/* Title */}
              <h2 className="text-3xl font-bold text-[#0F766E] mb-6 text-center">
                Log in
              </h2>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[#0F766E] font-semibold mb-2"
                  >
                    Email:
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[#0F766E] font-semibold mb-2"
                  >
                    Password:
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#0F766E] hover:bg-[#0d6b64] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Logging in...' : 'Log in'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Close
                  </button>
                </div>
              </form>

              {/* Sign up Link */}
              <div className="mt-6 text-center">
                <p className="text-slate-700">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onSwitchToSignUp) {
                        setTimeout(() => onSwitchToSignUp(), 100);
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
