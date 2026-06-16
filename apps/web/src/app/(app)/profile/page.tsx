'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS } from '@/lib/nav';
import { AuthApiError } from '@/lib/auth-api';
import { changePassword, updateProfile } from '@/lib/users-api';
import { PageHeader } from '@/components/PageHeader';

export default function ProfilePage() {
  const { user, authFetch } = useAuth();

  return (
    <div>
      <PageHeader title="Profile" context="Manage your account details and password." />

      <div className="space-y-8">
        <AccountSection
          email={user?.email ?? ''}
          role={user ? (ROLE_LABELS[user.role] ?? user.role) : ''}
          initialName={user?.name ?? ''}
          authFetch={authFetch}
        />
        <PasswordSection authFetch={authFetch} />
      </div>
    </div>
  );
}

type AuthFetch = ReturnType<typeof useAuth>['authFetch'];

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-xl border border-line bg-surface p-6">{children}</section>;
}

const inputClass = 'mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink';

function AccountSection({
  email,
  role,
  initialName,
  authFetch,
}: {
  email: string;
  role: string;
  initialName: string;
  authFetch: AuthFetch;
}) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setSuccess(false);
    setError(null);
    try {
      const { profile } = await updateProfile(authFetch, name.trim());
      setName(profile.name ?? '');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Could not save your changes.');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold text-ink">Account</h2>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-muted">Email</dt>
          <dd className="mt-1 text-ink">{email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted">Role</dt>
          <dd className="mt-1 text-ink">{role}</dd>
        </div>
      </dl>

      <form onSubmit={handleSubmit} className="mt-6 max-w-sm" noValidate>
        <label htmlFor="name" className="block text-sm font-medium text-ink">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSuccess(false);
          }}
          maxLength={80}
          required
          aria-describedby={error ? 'name-error' : success ? 'name-success' : undefined}
          aria-invalid={error ? true : undefined}
          className={inputClass}
        />
        {error && (
          <p id="name-error" role="alert" className="mt-1 text-sm text-beacon">
            {error}
          </p>
        )}
        {success && (
          <p id="name-success" role="status" className="mt-1 text-sm text-bridge">
            Your name has been updated.
          </p>
        )}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 py-2.5 font-medium text-canvas transition hover:bg-ink/90 disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Card>
  );
}

function PasswordSection({ authFetch }: { authFetch: AuthFetch }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setSuccess(false);
    setError(null);
    try {
      await changePassword(authFetch, currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Could not update your password.');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold text-ink">Change password</h2>
      <p className="mt-1 text-sm text-muted">
        Choose a strong password you don&apos;t use elsewhere.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-sm space-y-4" noValidate>
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-ink">
            Current password
          </label>
          <input
            id="current-password"
            name="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-describedby={error ? 'password-error' : undefined}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-ink">
            New password
          </label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-describedby={error ? 'password-error' : 'new-password-hint'}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
          <p id="new-password-hint" className="mt-1 text-sm text-muted">
            At least 8 characters.
          </p>
        </div>

        {error && (
          <p id="password-error" role="alert" className="text-sm text-beacon">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-sm text-bridge">
            Your password has been updated.
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="inline-flex min-h-11 items-center rounded-lg bg-ink px-5 py-2.5 font-medium text-canvas transition hover:bg-ink/90 disabled:opacity-60"
        >
          {status === 'saving' ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </Card>
  );
}
