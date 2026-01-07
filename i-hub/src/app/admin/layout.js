'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Reports', href: '/admin/reports', icon: '📈' },
  { name: 'Billing', href: '/admin/billing', icon: '💳' },
  { name: 'Schedule Visit', href: '/admin/schedule-visit', icon: '📅' },
  { name: 'Meeting Room', href: '/admin/meeting-room', icon: '🏢' },
  { name: 'Tenants', href: '/admin/tenants', icon: '👥' },
  { name: 'Map', href: '/admin/map', icon: '🗺️' },
];

const bottomNavItems = [
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.sidebarHeader}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🏢</div>
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>Inspire Hub</span>
                <span className={styles.logoSubtitle}>Admin Panel</span>
              </div>
            </div>
          </div>
          <nav className={styles.sidebarNav}>
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}>
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <nav className={`${styles.sidebarNav} ${styles.bottomNav}`}>
          {bottomNavItems.map((item) => (
            <Link key={item.name} href={item.href} className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
