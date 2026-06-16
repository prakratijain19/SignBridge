'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Wraps a page that requires authentication. While the initial silent refresh
 * runs it shows a minimal loading state; once resolved, an unauthenticated user
 * is redirected to /login and an authenticated one sees the children.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <main
        id="main"
        className="flex min-h-screen items-center justify-center px-6"
        aria-busy="true"
      >
        <p className="text-ink/60">Loading…</p>
      </main>
    );
  }

  if (!user) {
    // Redirect is in flight; render nothing to avoid a flash of protected content.
    return null;
  }

  return <>{children}</>;
}
