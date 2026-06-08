'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavItem = ({ href, label, icon, isActive }: { href: string; label: string; icon: string; isActive: boolean }) => (
  <Link
    href={href}
    className={`flex flex-1 flex-col items-center gap-1 py-2 px-1 text-xs uppercase tracking-wider font-mono transition-colors ${
      isActive ? 'text-accent' : 'text-muted hover:text-text'
    }`}
  >
    <span className="text-lg leading-none">{icon}</span>
    <span>{label}</span>
  </Link>
);

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg/97 border-t border-border flex z-50 backdrop-blur-xl">
      <NavItem
        href="/tracker"
        icon="📋"
        label="Tracker"
        isActive={pathname === '/tracker'}
      />
      <NavItem
        href="/stats"
        icon="📊"
        label="Stats"
        isActive={pathname === '/stats'}
      />
      <NavItem
        href="/banca"
        icon="🎯"
        label="Banca"
        isActive={pathname === '/banca'}
      />
    </nav>
  );
}
