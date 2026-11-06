'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { initials } from '@/lib/utils';
export default function Header({ openMenu }: { openMenu: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const page = pathname.startsWith('/issues')
    ? 'Issues'
    : pathname.startsWith('/users')
      ? 'Users'
      : pathname.startsWith('/profile')
        ? 'My profile'
        : 'Overview';
  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button
          className="icon-button mobile-menu"
          aria-label="Open navigation"
          onClick={openMenu}
        >
          <Menu size={22} />
        </button>
        <div className="breadcrumbs">
          <span>Workspace</span>
          <ChevronRight size={14} />
          <span>{page}</span>
        </div>
      </div>
      <Link
        href="/profile"
        className="header-profile"
        aria-label="View my profile"
      >
        <span className="profile-text">
          <strong>{user?.name}</strong>
          <span>
            {user?.role === 'ADMIN' ? 'Administrator' : 'Team member'}
          </span>
        </span>
        <span className="avatar">{initials(user?.name || 'U')}</span>
      </Link>
    </header>
  );
}
