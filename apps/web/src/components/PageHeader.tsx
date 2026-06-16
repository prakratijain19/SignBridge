/** Consistent page title + short context line used across the app shell. */
export function PageHeader({ title, context }: { title: string; context?: string }) {
  return (
    <header className="mb-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      {context && <p className="mt-2 max-w-prose text-muted">{context}</p>}
    </header>
  );
}
