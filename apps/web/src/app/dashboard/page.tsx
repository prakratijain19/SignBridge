'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';

const ROLE_LABELS: Record<string, string> = {
  DEAF_USER: 'Deaf user',
  HEARING_USER: 'Hearing user',
  LEARNER: 'Learner',
  ADMIN: 'Administrator',
};

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-signal">
        Phase 2 · Authenticated
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-4 max-w-prose text-lg text-ink/70">
        You are signed in. The full dashboard arrives in a later phase — for now,
        here are your account details.
      </p>

      <dl className="mt-10 grid gap-3 sm:grid-cols-2">
        <DetailCard label="Name" value={user?.name ?? '—'} />
        <DetailCard label="Email" value={user?.email ?? '—'} />
        <DetailCard
          label="Role"
          value={user ? ROLE_LABELS[user.role] ?? user.role : '—'}
        />
      </dl>

      <div className="mt-10">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-ink px-5 py-2.5 font-medium text-canvas transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          Log out
        </button>
      </div>
    </main>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-4 py-3">
      <dt className="text-sm font-semibold uppercase tracking-wider text-ink/50">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
