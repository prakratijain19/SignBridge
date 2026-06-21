'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, MessageSquare } from 'lucide-react';
import type { ConversationSummary } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/PageHeader';
import { deleteConversation, listConversations } from '@/lib/conversations-api';

const MODE_LABEL: Record<string, string> = {
  SPEECH: 'Speech',
  LIVE: 'Live',
  VIDEO: 'Video',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function HistoryPage() {
  const { authFetch } = useAuth();
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
      setError('Could not load your conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      await deleteConversation(authFetch, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Could not delete that conversation. Please try again.');
    }
  }

  return (
    <div>
      <PageHeader title="History" context="Your saved conversations and transcripts." />

      {error && (
        <p role="alert" className="mb-4 text-sm text-beacon">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted" aria-busy="true">
          Loading…
        </p>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <MessageSquare aria-hidden="true" className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-medium text-ink">No conversations yet</p>
          <p className="mt-1 text-sm text-muted">
            Start one on the{' '}
            <Link href="/speech" className="font-medium text-signalInk underline">
              Speech
            </Link>{' '}
            page.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {conversations.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4"
            >
              <Link href={`/history/${c.id}`} className="min-w-0 flex-1 rounded">
                <span className="flex items-center gap-2">
                  <span className="font-medium text-ink">{c.title ?? formatDate(c.createdAt)}</span>
                  <span className="rounded-full border border-line bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
                    {MODE_LABEL[c.mode] ?? c.mode}
                  </span>
                </span>
                <span className="mt-1 block truncate text-sm text-muted">
                  {c.lastMessagePreview ?? 'No messages'} · {c.messageCount}{' '}
                  {c.messageCount === 1 ? 'message' : 'messages'}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                aria-label={`Delete conversation ${c.title ?? formatDate(c.createdAt)}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-beacon"
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
