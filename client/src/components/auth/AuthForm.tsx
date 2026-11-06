'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Layers2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { errorMessage } from '@/services/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ErrorState from '@/components/ui/ErrorState';
import Loading from '@/components/ui/Loading';
export default function AuthForm({ register = false }: { register?: boolean }) {
  const {
    login,
    user,
    loading,
    error: sessionError,
    refreshUser,
    logout,
  } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('registered'))
      setMessage('Account created successfully. Sign in to get started.');
    if (params.has('expired'))
      setMessage('Your session has expired. Please sign in again.');
  }, []);
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email')).trim();
    const password = String(values.get('password'));
    setError('');
    if (register && password !== values.get('confirmPassword')) {
      setError('Passwords do not match.');
      return;
    }
    if (register && new TextEncoder().encode(password).length > 72) {
      setError('Password must be at most 72 UTF-8 bytes.');
      return;
    }
    if (register && !String(values.get('name')).trim()) {
      setError('Please enter your full name.');
      return;
    }
    setBusy(true);
    try {
      if (register) {
        await authService.register({
          name: String(values.get('name')).trim(),
          email,
          password,
        });
        router.replace('/login?registered=1');
      } else {
        await login({ email, password });
        router.replace('/dashboard');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (loading || user) return <Loading message="Opening your workspace…" />;
  if (sessionError)
    return (
      <div className="auth-form">
        <ErrorState message={sessionError} retry={() => void refreshUser()} />
        <Button variant="secondary" onClick={logout}>
          Return to login
        </Button>
      </div>
    );
  return (
    <div className="auth-form">
      <div className="auth-mobile-brand">
        <Layers2 size={20} />
        Issue Tracker
      </div>
      <p className="eyebrow">YOUR TEAM, CONNECTED</p>
      <h1>{register ? 'Create your account' : 'Welcome back'}</h1>
      <p className="auth-description">
        {register
          ? 'Get started with a personal account for your team.'
          : 'Sign in to pick up where you left off.'}
      </p>
      {message && (
        <div className="info-message" role="status">
          {message}
        </div>
      )}
      {error && <ErrorState message={error} />}
      <form onSubmit={submit} className="form-stack">
        {register && (
          <Input
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            required
            maxLength={100}
            disabled={busy}
          />
        )}
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          maxLength={254}
          disabled={busy}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete={register ? 'new-password' : 'current-password'}
          placeholder={
            register ? 'Choose a strong password' : 'Enter your password'
          }
          required
          minLength={register ? 8 : undefined}
          hint={
            register
              ? 'At least 8 characters, up to 72 UTF-8 bytes.'
              : undefined
          }
          disabled={busy}
        />
        {register && (
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            minLength={8}
            disabled={busy}
          />
        )}
        <Button type="submit" loading={busy} className="w-full">
          {busy
            ? register
              ? 'Creating account…'
              : 'Signing in…'
            : register
              ? 'Create account'
              : 'Sign in'}
          {!busy && <ArrowRight size={16} />}
        </Button>
      </form>
      <p className="auth-switch">
        {register ? 'Already have an account?' : 'New to Issue Tracker?'}{' '}
        <Link href={register ? '/login' : '/register'}>
          {register ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
      <p className="auth-security">
        {register
          ? 'Accounts are created with team member access.'
          : 'Use your team member or administrator account.'}
      </p>
    </div>
  );
}
