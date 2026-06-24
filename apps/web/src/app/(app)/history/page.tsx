'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, MessageSquare } from 'lucide-react';
import type { ConversationSummary } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useT, type TFunction } from '@/lib/i18n/use-translation';
import { PageHeader } from '@/components/PageHeader';
import { deleteConversation, listConversations } from '@/lib/conversations-api';

function modeLabel(t: TFunction, mode: string): string {
  const map: Record<string, string> = {
    SPEECH: t('history.mode.SPEECH'),
    LIVE: t('history.mode.LIVE'),
    VIDEO: t('history.mode.VIDEO'),
  };
  return map[mode] ?? mode;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function HistoryPage() {
  const { authFetch } = useAuth();
  const t = useT();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { conversations: list } = await listConversations(authFetch);
      setConversations(list);
    } catch {
      setError(t('history.loadError'));
    } finally {
      setLoading(false);
    }
  }, [authFetch, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm(t('history.deleteConfirm'))) return;
    try {
      await deleteConversation(authFetch, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError(t('history.deleteError'));
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('history.title')} context={t('history.context')} />

      {error && (
        <p role="alert" className="mb-4 text-sm text-beacon">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted" aria-busy="true">
          {t('history.loading')}
        </p>
      ) : conversations.length === 0 ? (
        <div className="card p-8 text-center">
          <div aria-hidden="true" className="icon-tile mx-auto h-12 w-12">
            <MessageSquare className="h-6 w-6" />
          </div>
          <p className="mt-3 font-medium text-ink">{t('history.empty')}</p>
          <p className="mt-1 text-sm text-muted">
            {t('history.emptyStartPrefix')}{' '}
            <Link href="/speech" className="font-medium text-signalInk underline">
              {t('history.emptySpeechLink')}
            </Link>{' '}
            {t('history.emptyStartSuffix')}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {conversations.map((c) => (
            <li
              key={c.id}
              className="card card-hover group flex items-center justify-between gap-4 p-4"
            >
              <Link
                href={`/history/${c.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded"
              >
                <span aria-hidden="true" className="icon-tile h-10 w-10 shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ink">
                      {c.title ?? formatDate(c.createdAt)}
                    </span>
                    <span className="chip">{modeLabel(t, c.mode)}</span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-muted">
                    {c.lastMessagePreview ?? t('history.noMessages')} · {c.messageCount}{' '}
                    {c.messageCount === 1 ? t('history.messageOne') : t('history.messageOther')}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                aria-label={t('history.deleteAria', {
                  title: c.title ?? formatDate(c.createdAt),
                })}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-canvas hover:text-beacon"
              >
                <Trash2 aria-hidden="true" className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
