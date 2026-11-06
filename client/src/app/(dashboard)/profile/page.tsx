'use client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, initials } from '@/lib/utils';
import PageHeading from '@/components/ui/PageHeading';
export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageHeading
        eyebrow="ACCOUNT"
        title="My profile"
        description="Your account details and workspace access."
      />
      <section className="panel profile-panel">
        <div className="profile-card-heading">
          <span className="avatar avatar-large">{initials(user.name)}</span>
          <div>
            <h2>{user.name}</h2>
            <p>{user.role === 'ADMIN' ? 'Administrator' : 'Team member'}</p>
          </div>
        </div>
        <dl className="profile-details">
          <div>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{user.role === 'ADMIN' ? 'Administrator' : 'User'}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
        <p className="profile-help">
          Contact your administrator if your name or email needs to be updated.
        </p>
      </section>
    </>
  );
}
