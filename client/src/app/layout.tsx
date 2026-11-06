import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { NoticeProvider } from '@/context/NoticeContext';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Issue Tracker', template: '%s | Issue Tracker' },
  description: 'Create, assign and track your team’s issues in one workspace.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NoticeProvider>{children}</NoticeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
