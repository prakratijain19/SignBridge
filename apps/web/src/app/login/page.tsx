'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AuthApiError } from '@/lib/auth-api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace('/dashboard');
    } catch (err) {
      setFormError(
        err instanceof AuthApiError ? err.message : 'Something went wrong. Please try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <main
      id="main"
      className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-hero-mesh opacity-60"
      />
      <div className="animate-fade-up">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-aurora text-white shadow-glow transition group-hover:scale-105"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M4 8v8M20 8v8" strokeLinecap="round" />
              <path d="M4 12h16" strokeLinecap="round" />
            </svg>
          </span>
          SignBridge
        </Link>
      </div>

      <div className="card mt-6 animate-fade-up p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome <span className="text-gradient">back</span>
        </h1>
        <p className="mt-2 text-muted">Log in to continue to SignBridge.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-beacon/40 bg-beacon/10 px-4 py-3 text-sm text-ink"
            >
              {formError}
            </p>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-signalInk hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
