'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, getUserFromCookie, getAdminCacheFromCookie, setAdminCacheInCookie, removeAdminCacheFromCookie } from '@/lib/api';

/**
 * AdminAuthGuard Component
 * Protects admin routes by checking if user is authenticated and has admin role
 * - Redirects non-authenticated users to login
 * - Redirects client users to client dashboard
 * - Only allows admin users to access admin routes
 * 
 * OPTIMIZED: Only checks admin status ONCE on initial mount, uses cookie cache
 * to prevent repeated Firestore reads on route changes.
 */
export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedRef = useRef(false);
  const checkInProgressRef = useRef(false);

  useEffect(() => {
    // Only check on initial mount, not on every route change
    if (hasCheckedRef.current || checkInProgressRef.current) {
      return;
    }

    const checkAdminAccess = async () => {
      // Prevent concurrent checks
      if (checkInProgressRef.current) {
        return;
      }
      checkInProgressRef.current = true;
      hasCheckedRef.current = true;

      try {
        setIsLoading(true);

        // Allow access to register page without auth check
        if (pathname === '/admin/register') {
          setIsAuthorized(true);
          setIsLoading(false);
          checkInProgressRef.current = false;
          return;
        }

        // Check if user is logged in (only in browser)
        if (typeof window === 'undefined') {
          setIsLoading(false);
          checkInProgressRef.current = false;
          return;
        }

        // Get user from cookie (tokens are in HttpOnly cookies, user info is in non-HttpOnly cookie)
        const user = getUserFromCookie();
        if (!user || !user.uid) {
          // Not logged in - redirect to landing page
          console.warn('⚠️  Unauthorized: Not logged in. Redirecting to home page.');
          router.push('/');
          checkInProgressRef.current = false;
          return;
        }

        // Check cookie cache FIRST (10 minute duration)
        const cachedData = getAdminCacheFromCookie(user.uid);
        
        if (cachedData) {
          try {
            const { isAdmin, timestamp } = cachedData;
            const cacheAge = Date.now() - timestamp;
            const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

            if (cacheAge < CACHE_DURATION && isAdmin === true) {
              // Cache is valid and user is admin
              console.log('✅ Admin auth: Using cached result');
              setIsAuthorized(true);
              setIsLoading(false);
              checkInProgressRef.current = false;
              return;
            } else if (cacheAge < CACHE_DURATION && isAdmin === false) {
              // Cache is valid but user is not admin - check if client or redirect
              console.log('✅ Admin auth: Using cached result (not admin)');
              // Continue to check if they're a client
            } else {
              // Cache expired - remove it and continue with API call
              removeAdminCacheFromCookie(user.uid);
            }
          } catch (e) {
            // Invalid cache - remove it
            removeAdminCacheFromCookie(user.uid);
          }
        }

        // Check if user is admin by fetching admin user data
        try {
          const response = await api.get(`/api/accounts/admin/users/${user.uid}`);
          
          if (response.success && response.data) {
            // User exists in admin collection - authorized
            // Cache the result for 10 minutes in cookie
            setAdminCacheInCookie(user.uid, {
              isAdmin: true,
              timestamp: Date.now()
            });
            setIsAuthorized(true);
          } else {
            // User not found in admin collection - check if they're a client
            // Cache the negative result in cookie
            setAdminCacheInCookie(user.uid, {
              isAdmin: false,
              timestamp: Date.now()
            });

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
            // Cache the negative result in cookie
            setAdminCacheInCookie(user.uid, {
              isAdmin: false,
              timestamp: Date.now()
            });

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
        checkInProgressRef.current = false;
        setIsLoading(false);
      }
    };

    checkAdminAccess();
    // Only run on mount - removed pathname and router from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = only run once on mount

  // Handle register page separately (no auth needed)
  if (pathname === '/admin/register' && !isLoading) {
    return <>{children}</>;
  }

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
