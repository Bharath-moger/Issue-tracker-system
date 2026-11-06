'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import ErrorState from '@/components/ui/ErrorState';
import Button from '@/components/ui/Button';
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, error, refreshUser, logout, loginPath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!loading && !user && !error) router.replace(loginPath);
  }, [loading, user, error, router, loginPath]);
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  if (loading) return <Loading message="Loading your workspace…" />;
  if (error)
    return (
      <main className="standalone-state">
        <ErrorState message={error} retry={() => void refreshUser()} />
        <Button variant="secondary" onClick={logout}>
          Return to login
        </Button>
      </main>
    );
  if (!user) return <Loading message="Redirecting to login…" />;
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="desktop-sidebar">
        <Sidebar />
      </div>
      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Navigation"
        className="navigation-modal"
      >
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </Modal>
      <div className="app-main">
        <Header openMenu={() => setMenuOpen(true)} />
        <main id="main-content" className="content">
          {children}
        </main>
        <footer className="main-footer">
          <span>Issue Tracker System</span>
          <span>One workspace. Every issue.</span>
        </footer>
      </div>
    </div>
  );
}
