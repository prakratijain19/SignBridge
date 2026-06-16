'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SELECTABLE_ROLES, type UserRole } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { AuthApiError } from '@/lib/auth-api';

const ROLE_LABELS: Record<UserRole, string> = {
  DEAF_USER: 'Deaf user',
  HEARING_USER: 'Hearing user',
  LEARNER: 'Learner',
  ADMIN: 'Administrator',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(SELECTABLE_ROLES[0] ?? 'HEARING_USER');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register({ email, password, role, name: name.trim() || undefined });
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof AuthApiError) {
        setFormError(err.message);
        setFieldErrors(err.details ?? {});
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  }

  const fieldError = (field: string): string | undefined => fieldErrors[field]?.[0];

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-ink/70">Join SignBridge.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-beacon/40 bg-beacon/10 px-4 py-3 text-sm text-ink"
          >
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name <span className="text-ink/50">(optional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-describedby={fieldError('name') ? 'name-error' : undefined}
            aria-invalid={fieldError('name') ? true : undefined}
            className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          />
          {fieldError('name') && (
            <p id="name-error" className="mt-1 text-sm text-beacon">
              {fieldError('name')}
            </p>
          )}
        </div>

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
            aria-describedby={fieldError('email') ? 'email-error' : undefined}
            aria-invalid={fieldError('email') ? true : undefined}
            className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          />
          {fieldError('email') && (
            <p id="email-error" className="mt-1 text-sm text-beacon">
              {fieldError('email')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={
              fieldError('password') ? 'password-error' : 'password-hint'
            }
            aria-invalid={fieldError('password') ? true : undefined}
            className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          />
          {fieldError('password') ? (
            <p id="password-error" className="mt-1 text-sm text-beacon">
              {fieldError('password')}
            </p>
          ) : (
            <p id="password-hint" className="mt-1 text-sm text-ink/50">
              At least 8 characters.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium">
            I am a…
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            aria-describedby={fieldError('role') ? 'role-error' : undefined}
            aria-invalid={fieldError('role') ? true : undefined}
            className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            {SELECTABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          {fieldError('role') && (
            <p id="role-error" className="mt-1 text-sm text-beacon">
              {fieldError('role')}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-ink px-5 py-2.5 font-medium text-canvas transition hover:bg-ink/90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/70">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-signal underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
