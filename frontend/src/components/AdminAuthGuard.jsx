'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

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

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
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

        // Check if user is admin by fetching admin user data
        try {
          const response = await api.get(`/api/accounts/admin/users/${user.uid}`);
          
          if (response.success && response.data) {
            // User exists in admin collection - authorized
            setIsAuthorized(true);
          } else {
            // User not found in admin collection - check if they're a client
            try {
              const clientResponse = await api.get(`/api/accounts/client/users/${user.uid}`);
              if (clientResponse.success && clientResponse.data) {
                // User is a client, not an admin - redirect to client dashboard
                console.warn('⚠️  Unauthorized: Client user attempting to access admin dashboard. Redirecting to client dashboard.');
                router.push('/client/home');
              } else {
                // User doesn't exist in either collection - redirect to landing page
                console.warn('⚠️  Unauthorized: User not found in admin or client collections. Redirecting to home page.');
                router.push('/');
              }
            } catch (clientError) {
              // Error checking client - user might not be registered yet
              // Redirect to landing page
              console.warn('⚠️  Unauthorized: Error verifying user. Redirecting to home page.');
              router.push('/');
            }
          }
        } catch (error) {
          // 404 means user is not an admin
          if (error.response?.status === 404) {
            // Check if they're a client
            try {
              const clientResponse = await api.get(`/api/accounts/client/users/${user.uid}`);
              if (clientResponse.success && clientResponse.data) {
                // User is a client - redirect to client dashboard
                console.warn('⚠️  Unauthorized: Client user attempting to access admin dashboard. Redirecting to client dashboard.');
                router.push('/client/home');
              } else {
                // User doesn't exist - redirect to landing page
                console.warn('⚠️  Unauthorized: User not found. Redirecting to home page.');
                router.push('/');
              }
            } catch {
              // Error checking - redirect to landing page
              console.warn('⚠️  Unauthorized: Error verifying user. Redirecting to home page.');
              router.push('/');
            }
          } else {
            // Other error - show error and redirect
            console.error('Error checking admin access:', error);
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Error in admin auth guard:', error);
        router.push('/');
      } finally {
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
