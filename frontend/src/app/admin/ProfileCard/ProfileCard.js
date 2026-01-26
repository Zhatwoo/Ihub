'use client';

import { useState, useEffect } from 'react';
import { api, getUserFromCookie } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProfileCard({ onClick }) {
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Get user from cookie (tokens are in HttpOnly cookies)
        const user = getUserFromCookie();
        if (!user || !user.uid) {
          setLoading(false);
          return;
        }

        // Fetch admin data from backend
        try {
          const response = await api.get(`/api/accounts/admin/users/${user.uid}`);
          
          if (response.success && response.data) {
            setAdminData(response.data);
          }
        } catch (error) {
          // Handle 404 (admin user not found) gracefully - this is expected for new admins
          // Admin may be authenticated but not yet have a document in accounts/admin/users
          if (error.response?.status === 404) {
            // Admin user not found in accounts collection - use basic info from cookie
            // This is fine, the ProfileCard will use default values
            setAdminData(null);
          } else {
            // Log other errors but don't break the UI
            console.error('Error fetching admin data:', error);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Get user info from cookie as fallback
  const getUserInfo = () => {
    try {
      const user = getUserFromCookie();
      if (user) {
        return {
          email: user.email || '',
          displayName: user.displayName || ''
        };
      }
    } catch (error) {
      console.error('Error getting user from cookie:', error);
    }
    return { email: '', displayName: '' };
  };

  const userInfo = getUserInfo();
  const firstName = adminData?.firstName || 
                    userInfo.displayName?.split(' ')[0] || 
                    userInfo.email?.split('@')[0] || 
                    'Admin';
  const profilePicture = adminData?.profilePicture || null;

  if (loading) {
    return (
      <div className="relative p-3 rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 animate-pulse flex-shrink-0"></div>
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3.5 bg-white/10 rounded animate-pulse w-20"></div>
            <div className="h-2.5 bg-white/10 rounded animate-pulse w-14"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative w-full p-3 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-800/60 border border-white/10 hover:border-teal-500/30 hover:from-slate-700/80 hover:to-slate-800/80 transition-all duration-300 group"
    >
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/0 to-teal-600/0 group-hover:from-teal-500/5 group-hover:to-teal-600/5 transition-all duration-300" />
      
      <div className="relative flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-base overflow-hidden shadow-lg shadow-teal-600/20">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{firstName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          {/* Online status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-sm" />
        </div>

        {/* Info */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="truncate font-semibold text-white text-sm w-full text-left">
            {firstName}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-teal-500/20 text-teal-400 rounded">
              Admin
            </span>
          </div>
        </div>

        {/* Settings icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-all duration-200">
          <svg 
            className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    </button>
  );
}

