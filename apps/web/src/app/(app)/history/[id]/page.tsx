'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Volume2 } from 'lucide-react';
import type {
  ConversationWithMessages,
  Message,
  MessageModality,
  MessageSender,
} from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/PageHeader';
import { getConversation } from '@/lib/conversations-api';
import { useTextToSpeech } from '@/lib/speech/use-text-to-speech';

const SENDER_LABEL: Record<MessageSender, string> = {
  USER: 'You',
  PARTNER: 'Partner',
};

const MODALITY_LABEL: Record<MessageModality, string> = {
  SPEECH: 'Spoken',
  TEXT: 'Typed',
  SIGN: 'Signed',
  AVATAR: 'Avatar',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const { authFetch } = useAuth();
  const tts = useTextToSpeech();
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { conversation: c } = await getConversation(authFetch, params.id);
      setConversation(c);
    } catch {
      setError('This conversation could not be found.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const title =
    conversation?.title ?? (conversation ? formatDate(conversation.createdAt) : 'Conversation');

  return (
    <div>
      <Link
        href="/history"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-signalInk hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to history
      </Link>

      <PageHeader title={title} context="A transcript of this conversation." />

      {error && (
        <p role="alert" className="text-sm text-beacon">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted" aria-busy="true">
          Loading…
        </p>
      ) : conversation && conversation.messages.length > 0 ? (
        <ol className="space-y-3">
          {conversation.messages.map((m) => (
            <MessageRow key={m.id} message={m} tts={tts} />
          ))}
        </ol>
      ) : (
        !error && <p className="text-muted">This conversation has no messages.</p>
      )}
    </div>
  );
}

function MessageRow({
  message,
  tts,
}: {
  message: Message;
  tts: ReturnType<typeof useTextToSpeech>;
}) {
  const canReplay = tts.supported && (message.modality === 'SPEECH' || message.modality === 'TEXT');

  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {SENDER_LABEL[message.sender]} · {MODALITY_LABEL[message.modality]} ·{' '}
          {message.language.toUpperCase()}
        </p>
        {canReplay && (
          <button
            type="button"
            onClick={() => void tts.speak(message.content, { lang: message.language })}
            aria-label={`Replay: ${message.content}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-signalInk hover:bg-canvas"
          >
            <Volume2 aria-hidden="true" className="h-4 w-4" />
            Replay
          </button>
        )}
      </div>
      <p className="mt-1 text-ink">{message.content}</p>
    </li>
  );
}
