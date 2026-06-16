import { getApiHealth } from '@/lib/api';

export default async function HomePage() {
  const health = await getApiHealth();
  const online = health?.success === true && health.data.status === 'ok';
  const dbConnected =
    health?.success === true && health.data.dependencies.database === 'connected';

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-signal">
        Phase 1 · Foundation
      </p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight">SignBridge</h1>
      <p className="mt-4 max-w-prose text-lg text-ink/70">
        Bridging communication beyond language and hearing barriers. This is the project
        scaffold — the full experience is built up phase by phase.
      </p>

      <section aria-labelledby="status-heading" className="mt-12">
        <h2 id="status-heading" className="text-sm font-semibold uppercase tracking-wider text-ink/50">
          System status
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatusCard label="Web app" ok={true} okText="Running" badText="—" />
          <StatusCard label="API" ok={online} okText="Reachable" badText="Unreachable" />
          <StatusCard
            label="Database"
            ok={dbConnected}
            okText="Connected"
            badText="Disconnected"
          />
          <StatusCard
            label="Shared types"
            ok={true}
            okText="Linked"
            badText="—"
          />
        </dl>
        {!online && (
          <p className="mt-4 text-sm text-ink/60">
            The API is not responding. Start it with <code className="rounded bg-ink/5 px-1.5 py-0.5">pnpm dev</code> and make sure
            PostgreSQL is running (<code className="rounded bg-ink/5 px-1.5 py-0.5">pnpm docker:up</code>).
          </p>
        )}
      </section>
    </main>
  );
}

function StatusCard({
  label,
  ok,
  okText,
  badText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-ink/10 bg-white px-4 py-3">
      <dt className="font-medium">{label}</dt>
      <dd className="flex items-center gap-2 text-sm">
        <span
          aria-hidden="true"
          className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-signal' : 'bg-beacon'}`}
        />
        {ok ? okText : badText}
      </dd>
    </div>
  );
}
