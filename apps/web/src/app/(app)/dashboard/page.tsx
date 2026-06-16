'use client';

import { MessageSquare, GraduationCap, Siren, Video } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/PageHeader';
import { FeatureCard } from '@/components/FeatureCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0];

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
        context="Your bridge to clear communication. Pick up where you left off or start something new."
      />

      <StartConversationHero />

      <section aria-labelledby="modules-heading" className="mt-10">
        <h2
          id="modules-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted"
        >
          Modules
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={MessageSquare}
            title="Conversation"
            description="Real-time sign, speech, and text translation in one place."
            comingSoon
          />
          <FeatureCard
            icon={GraduationCap}
            title="Learn ISL"
            description="Practice Indian Sign Language with guided lessons."
            comingSoon
          />
          <FeatureCard
            icon={Siren}
            title="Emergency"
            description="Fast, clear communication when every second counts."
            comingSoon
          />
          <FeatureCard
            icon={Video}
            title="Video call"
            description="Face-to-face calls with live captions and interpretation."
            comingSoon
          />
        </div>
      </section>
    </div>
  );
}

/**
 * The signature element: a single prominent card for the product's core job.
 * A restrained two-channel "bridge" motif suggests two people / modalities
 * meeting. The action is not yet wired (Conversation lands in a later phase),
 * so it is clearly marked rather than linking nowhere.
 */
function StartConversationHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden rounded-2xl border border-line bg-ink px-6 py-10 text-canvas sm:px-10"
    >
      <BridgeMotif />
      <div className="relative max-w-xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-canvas/70">
          Start here
        </p>
        <h2 id="hero-heading" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          Start a conversation
        </h2>
        <p className="mt-3 text-canvas/80">
          Bridge sign, speech, and text in real time — so everyone in the room can
          follow along.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-11 items-center rounded-lg bg-signal px-5 py-2.5 font-medium text-surface opacity-70"
          >
            Start a conversation
          </button>
          <span className="text-sm text-canvas/70">Opens in a later phase.</span>
        </div>
      </div>
    </section>
  );
}

/** Decorative two-channel bridge lines. Motion is handled globally via the
 *  reduced-motion rules; this is static and purely decorative. */
function BridgeMotif() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 200"
      className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20"
      fill="none"
      stroke="currentColor"
    >
      <path d="M0 70 H400" strokeWidth="2" className="text-bridge" />
      <path d="M0 130 H400" strokeWidth="2" className="text-signal" />
      <circle cx="120" cy="70" r="6" className="fill-bridge" stroke="none" />
      <circle cx="280" cy="130" r="6" className="fill-signal" stroke="none" />
      <path d="M120 70 C 180 70, 220 130, 280 130" strokeWidth="2" className="text-canvas" />
    </svg>
  );
}
