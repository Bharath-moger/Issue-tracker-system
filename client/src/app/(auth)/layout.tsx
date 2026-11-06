import Link from 'next/link';
import { Layers2, ListTodo, Users, CircleCheck } from 'lucide-react';
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-shell">
      <aside className="auth-aside">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Layers2 size={22} />
          </span>
          <span>
            Issue Tracker<span className="brand-subtitle">TEAM WORKSPACE</span>
          </span>
        </Link>
        <div className="auth-intro">
          <p className="eyebrow">LESS FRICTION. MORE PROGRESS.</p>
          <h2>
            Keep every issue
            <br />
            moving forward.
          </h2>
          <p>
            A clear place for your team to track work, take ownership, and get
            things resolved.
          </p>
          <div className="auth-feature">
            <ListTodo size={20} />
            <div>
              <strong>Track what matters</strong>
              <span>All your issues in one organized workspace.</span>
            </div>
          </div>
          <div className="auth-feature">
            <Users size={20} />
            <div>
              <strong>Work together</strong>
              <span>Clear ownership and focused discussions.</span>
            </div>
          </div>
          <div className="auth-feature">
            <CircleCheck size={20} />
            <div>
              <strong>See the progress</strong>
              <span>From open to in progress to resolved.</span>
            </div>
          </div>
        </div>
        <p className="auth-footer">Issue Tracker System</p>
      </aside>
      <section className="auth-main">{children}</section>
    </main>
  );
}
