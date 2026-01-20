'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivateOffice() {
  const router = useRouter();

  useEffect(() => {

    // Redirect to dashboard page by default
    router.replace('/admin/private-office/dashboard');
  }, [router]);


  return null;
}