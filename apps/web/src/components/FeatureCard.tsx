import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

/**
 * A dashboard module card. When `href` is set the card links to a live feature;
 * when `comingSoon` is set it is non-navigating (the real feature lands in a
 * later phase) and clearly badged, so there are no dead links.
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  comingSoon = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="icon-tile h-11 w-11 transition group-hover:scale-105">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        {comingSoon && (
          <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
            Coming soon
          </span>
        )}
        {href && !comingSoon && (
          <ArrowRight
            aria-hidden="true"
            className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-signalInk"
          />
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </>
  );

  if (href && !comingSoon) {
    return (
      <Link href={href} className="card card-hover group flex h-full flex-col p-5">
        {body}
      </Link>
    );
  }

  return (
    <div className="card flex h-full flex-col p-5" aria-disabled={comingSoon || undefined}>
      {body}
    </div>
  );
}
