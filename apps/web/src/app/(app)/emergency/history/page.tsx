'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { EmergencyEvent } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/use-translation';
import { PageHeader } from '@/components/PageHeader';
import { clearHistory, listHistory } from '@/lib/emergency-api';

const CHANNEL_KEY: Record<string, string> = {
  spoken: 'emergency.history.channel.spoken',
  displayed: 'emergency.history.channel.displayed',
  contact: 'emergency.history.channel.contact',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function EmergencyHistoryPage() {
  const t = useT();
  const { authFetch } = useAuth();
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { events: list } = await listHistory(authFetch);
      setEvents(list);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleClear() {
    if (!window.confirm(t('emergency.history.clearConfirm'))) return;
    await clearHistory(authFetch);
    setEvents([]);
  }

  return (
    <div className="animate-fade-up">
      <Link
        href="/emergency"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-signalInk hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('emergency.history.back')}
      </Link>

      <PageHeader title={t('emergency.history.title')} context={t('emergency.history.context')} />

      {events.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary mb-4 text-sm hover:text-beacon"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          {t('emergency.history.clear')}
        </button>
      )}

      {loading ? (
        <p className="text-muted" aria-busy="true">
          {t('emergency.history.loading')}
        </p>
      ) : events.length === 0 ? (
        <p className="text-muted">{t('emergency.history.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
              <p className="text-lg text-ink">{e.text}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                {CHANNEL_KEY[e.channel] ? t(CHANNEL_KEY[e.channel]!) : e.channel} ·{' '}
                {e.language.toUpperCase()} · {formatDate(e.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
