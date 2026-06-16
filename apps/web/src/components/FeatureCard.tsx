import type { LucideIcon } from 'lucide-react';

/**
 * A dashboard module card. When `comingSoon` is set the card is non-navigating
 * (the real feature lands in a later phase) and clearly badged, so there are
 * no dead links.
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  comingSoon = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  return (
    <div
      className="flex h-full flex-col rounded-xl border border-line bg-surface p-5"
      aria-disabled={comingSoon || undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-canvas text-signalInk">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        {comingSoon && (
          <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
