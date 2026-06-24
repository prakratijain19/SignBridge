import Link from 'next/link';
import { ArrowRight, Users, Mic, Hand, PersonStanding, Languages, History } from 'lucide-react';

const MODULES = [
  {
    href: '/live',
    label: 'Live conversation',
    icon: Users,
    desc: 'Bridge a speaker and a signer on one device.',
  },
  { href: '/speech', label: 'Speech', icon: Mic, desc: 'Speech-to-text and text-to-speech.' },
  {
    href: '/sign',
    label: 'Sign recognition',
    icon: Hand,
    desc: 'Recognize ISL signs from your camera.',
  },
  {
    href: '/avatar',
    label: 'Sign avatar',
    icon: PersonStanding,
    desc: 'A 3D hand fingerspells text.',
  },
  { href: '/translate', label: 'Translate', icon: Languages, desc: 'English, Hindi and Gujarati.' },
  { href: '/history', label: 'History', icon: History, desc: 'Revisit saved conversations.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-30 border-b">
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"
        >
          <span className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink">
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-aurora text-white shadow-glow"
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
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-ink transition hover:bg-canvas"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-sm font-medium text-canvas shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              Create account
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-hero-mesh opacity-70"
        />
        <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl animate-fade-up">
            <span className="chip">Communication, bridged</span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-7xl">
              Talk without <span className="text-gradient animate-gradient">barriers</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              An accessibility-first platform that bridges sign, speech, and text in real time — so
              Deaf and hearing people can communicate naturally, in English, Hindi, and Gujarati.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-primary px-6 py-3">
                Get started
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3">
                Log in
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center gap-1.5 px-2 font-medium text-signalInk hover:underline"
              >
                Open the app
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main id="main" className="mx-auto max-w-5xl px-6 pb-20">
        <section aria-labelledby="modules-heading">
          <h2
            id="modules-heading"
            className="text-sm font-semibold uppercase tracking-wider text-muted"
          >
            Explore
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(({ href, label, icon: Icon, desc }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="card card-hover group flex h-full items-start gap-3 p-5"
                >
                  <span className="icon-tile h-11 w-11 shrink-0 transition group-hover:scale-105">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-display font-semibold text-ink">{label}</span>
                    <span className="mt-1 block text-sm text-muted">{desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            You’ll be asked to log in the first time you open a module.
          </p>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted">
        <p>SignBridge — bridging communication beyond language and hearing barriers.</p>
      </footer>
    </div>
  );
}
