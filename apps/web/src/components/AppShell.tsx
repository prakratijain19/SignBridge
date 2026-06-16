'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NAV_ITEMS, ROLE_LABELS } from '@/lib/nav';
import { NavDrawer } from './NavDrawer';

/** The authenticated application shell: sidebar on desktop, top bar + drawer on mobile. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen lg:pl-64">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:fixed lg:inset-y-0 lg:left-0 lg:h-screen lg:w-64 lg:flex-col lg:items-stretch lg:justify-start lg:border-b-0 lg:border-r lg:px-0 lg:py-6">
        <div className="flex items-center lg:px-6">
          <Wordmark />
        </div>

        {/* Desktop primary nav */}
        <nav
          aria-label="Primary"
          className="hidden lg:mt-8 lg:flex lg:flex-1 lg:flex-col lg:gap-1 lg:px-3"
        >
          <NavLinks pathname={pathname} />
        </nav>

        {/* Desktop user chip */}
        <div className="hidden lg:block lg:border-t lg:border-line lg:px-3 lg:pt-4">
          <UserChip />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-label="Open navigation menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas lg:hidden"
        >
          <Menu aria-hidden="true" className="h-6 w-6" />
        </button>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Navigation">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <Wordmark />
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas"
          >
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3 py-4">
          <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
        </nav>
        <div className="border-t border-line px-3 py-4">
          <UserChip />
        </div>
      </NavDrawer>

      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-sm text-muted sm:px-6 lg:px-10">
        <p>SignBridge — bridging communication beyond language and hearing barriers.</p>
      </footer>
    </div>
  );
}

function Wordmark() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded font-display text-lg font-semibold tracking-tight text-ink"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-signal text-surface"
      >
        {/* Two-channel "bridge" motif */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 8v8M20 8v8" strokeLinecap="round" />
          <path d="M4 12h16" strokeLinecap="round" />
        </svg>
      </span>
      SignBridge
    </Link>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-canvas text-signalInk'
                : 'text-ink hover:bg-canvas'
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

function UserChip() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {user?.name ?? user?.email ?? 'Signed in'}
        </p>
        <p className="truncate text-xs text-muted">
          {user ? ROLE_LABELS[user.role] ?? user.role : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink hover:bg-canvas"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}
