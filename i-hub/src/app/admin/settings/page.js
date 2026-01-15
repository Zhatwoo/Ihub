'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileModal from '../ProfileCard/ProfileModal';

export default function Settings() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard since profile is now in the sidebar
    router.push('/admin');
  }, [router]);

  return null;
}
