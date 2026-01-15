'use client';

import { usePathname } from 'next/navigation';
import Header from './home/components/header';

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const isVirtualOffice = pathname === '/client/virtual-office';

  return (
    <div className="min-h-screen bg-slate-50">
      {!isVirtualOffice && <Header />}
      <main>{children}</main>
    </div>
  );
}
