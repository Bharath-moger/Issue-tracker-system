'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers2,
  LayoutDashboard,
  ListTodo,
  Users,
  UserRound,
  LogOut,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/issues', label: 'Issues', icon: ListTodo },
    ...(user?.role === 'ADMIN'
      ? [{ href: '/users', label: 'Users', icon: Users }]
      : []),
    { href: '/profile', label: 'My profile', icon: UserRound },
  ];
  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand" onClick={onNavigate}>
        <span className="brand-icon">
          <Layers2 size={21} />
        </span>
        <span>
          Issue Tracker<span className="brand-subtitle">TEAM WORKSPACE</span>
        </span>
      </Link>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'nav-link',
              pathname.startsWith(href) && 'nav-link-active',
            )}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="workspace-note">
          <span className="workspace-dot" />
          <span>
            {user?.role === 'ADMIN'
              ? 'Administrator workspace'
              : 'Personal workspace'}
          </span>
          <ArrowUpRight size={14} />
        </div>
        <button
          className="nav-link w-full"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
        >
          <LogOut size={18} />
          Sign out
        </button>
        <p className="sidebar-footer">Issue Tracker System</p>
      </div>
    </aside>
  );
}
