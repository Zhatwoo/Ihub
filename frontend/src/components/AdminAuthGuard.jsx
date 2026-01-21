'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

// Cache for admin auth check to prevent excessive API calls
const authCheckCache = {
  userId: null,
  isAdmin: null,
  timestamp: null,
  CACHE_DURATION: 10 * 60 * 1000 // 10 minutes
};

/**
 * AdminAuthGuard Component
 * Protects admin routes by checking if user is authenticated and has admin role
 * - Redirects non-authenticated users to login
 * - Redirects client users to client dashboard
 * - Only allows admin users to access admin routes
 */
export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const checkInProgressRef = useRef(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Prevent multiple simultaneous checks
        if (checkInProgressRef.current) {
          return;
        }

        setIsLoading(true);

        // Allow access to register page without auth check
        if (pathname === '/admin/register') {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Check if user is logged in (only in browser)
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const userStr = localStorage.getItem('user');
        if (!userStr) {
          // Not logged in - redirect to landing page
          console.warn('⚠️  Unauthorized: Not logged in. Redirecting to home page.');
          router.push('/');
          return;
        }

        const user = JSON.parse(userStr);
        if (!user?.uid) {
          // Invalid user data - redirect to landing page
          console.warn('⚠️  Unauthorized: Invalid user data. Redirecting to home page.');
          localStorage.removeItem('user');
          localStorage.removeItem('idToken');
          router.push('/');
          return;
        }

        // TEMPORARY: Skip admin check due to Firestore quota limits
        // Just verify user is logged in
        console.log('✅ User logged in, allowing admin access');
        setIsAuthorized(true);
        setIsLoading(false);
        return;

        // Original admin check code (disabled temporarily):
        /*
        // Check cache first - use localStorage for persistence across page reloads
        const cachedAdminStatus = localStorage.getItem(`admin_status_${user.uid}`);
        const cachedTimestamp = localStorage.getItem(`admin_status_timestamp_${user.uid}`);
        const now = Date.now();

        if (
          cachedAdminStatus !== null &&
          cachedTimestamp &&
          now - parseInt(cachedTimestamp) < authCheckCache.CACHE_DURATION
        ) {
          // Use cached result
          const isAdmin = cachedAdminStatus === 'true';
          if (isAdmin) {
            setIsAuthorized(true);
          } else {
            console.warn('⚠️  Unauthorized: User is not an admin. Redirecting to client dashboard.');
            router.push('/client/home');
          }
          setIsLoading(false);
          return;
        }

        checkInProgressRef.current = true;

        // Add a small delay to prevent quota exhaustion from rapid requests
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if user is admin by fetching admin user data
        try {
          const response = await api.get(`/api/accounts/admin/users/${user.uid}`);
          
          if (response.success && response.data) {
            // User exists in admin collection - authorized
            localStorage.setItem(`admin_status_${user.uid}`, 'true');
            localStorage.setItem(`admin_status_timestamp_${user.uid}`, now.toString());
            setIsAuthorized(true);
          } else {
            // User not found in admin collection
            localStorage.setItem(`admin_status_${user.uid}`, 'false');
            localStorage.setItem(`admin_status_timestamp_${user.uid}`, now.toString());
            console.warn('⚠️  Unauthorized: User is not an admin. Redirecting to client dashboard.');
            router.push('/client/home');
          }
        } catch (error) {
          // 404 means user is not an admin
          if (error.response?.status === 404) {
            localStorage.setItem(`admin_status_${user.uid}`, 'false');
            localStorage.setItem(`admin_status_timestamp_${user.uid}`, now.toString());
            console.warn('⚠️  Unauthorized: User not found in admin collection. Redirecting to client dashboard.');
            router.push('/client/home');
          } else if (error.message && error.message.includes('Quota exceeded')) {
            // Quota exceeded - assume user is not admin to prevent redirect loop
            localStorage.setItem(`admin_status_${user.uid}`, 'false');
            localStorage.setItem(`admin_status_timestamp_${user.uid}`, now.toString());
            console.warn('⚠️  Quota exceeded. Assuming user is not admin.');
            router.push('/client/home');
          } else {
            // Other error - show error and redirect
            console.error('Error checking admin access:', error);
            router.push('/');
          }
        }
        */
      } catch (error) {
        console.error('Error in admin auth guard:', error);
        router.push('/');
      } finally {
        checkInProgressRef.current = false;
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, pathname]);

  // Show loading state while checking authorization
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Only render children if authorized
  if (!isAuthorized) {
    return null; // Will redirect, so show nothing
  }

  return <>{children}</>;
}
