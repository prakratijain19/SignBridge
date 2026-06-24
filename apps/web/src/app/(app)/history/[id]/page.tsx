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
import { useT, type TFunction } from '@/lib/i18n/use-translation';
import { PageHeader } from '@/components/PageHeader';
import { getConversation } from '@/lib/conversations-api';
import { useTextToSpeech } from '@/lib/speech/use-text-to-speech';

function senderLabel(t: TFunction, sender: MessageSender): string {
  const map: Record<MessageSender, string> = {
    USER: t('history.sender.USER'),
    PARTNER: t('history.sender.PARTNER'),
  };
  return map[sender];
}

function modalityLabel(t: TFunction, modality: MessageModality): string {
  const map: Record<MessageModality, string> = {
    SPEECH: t('history.modality.SPEECH'),
    TEXT: t('history.modality.TEXT'),
    SIGN: t('history.modality.SIGN'),
    AVATAR: t('history.modality.AVATAR'),
  };
  return map[modality];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const { authFetch } = useAuth();
  const t = useT();
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
      setError(t('history.notFound'));
    } finally {
      setLoading(false);
    }
  }, [authFetch, params.id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const title =
    conversation?.title ??
    (conversation ? formatDate(conversation.createdAt) : t('history.conversationFallback'));

  return (
    <div className="animate-fade-up">
      <Link
        href="/history"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-signalInk hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('history.backToHistory')}
      </Link>

      <PageHeader title={title} context={t('history.detailContext')} />

      {error && (
        <p role="alert" className="text-sm text-beacon">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted" aria-busy="true">
          {t('history.loading')}
        </p>
      ) : conversation && conversation.messages.length > 0 ? (
        <ol className="space-y-3">
          {conversation.messages.map((m) => (
            <MessageRow key={m.id} message={m} tts={tts} />
          ))}
        </ol>
      ) : (
        !error && <p className="text-muted">{t('history.noMessagesDetail')}</p>
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
  const t = useT();
  const canReplay = tts.supported && (message.modality === 'SPEECH' || message.modality === 'TEXT');
  const isUser = message.sender === 'USER';

  return (
    <li className={`rounded-xl border border-line p-4 ${isUser ? 'bg-aurora-soft' : 'bg-canvas'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
          <span className="chip">{senderLabel(t, message.sender)}</span>
          <span className="chip">{modalityLabel(t, message.modality)}</span>
          <span className="chip">{message.language.toUpperCase()}</span>
        </p>
        {canReplay && (
          <button
            type="button"
            onClick={() => void tts.speak(message.content, { lang: message.language })}
            aria-label={t('history.replayAria', { content: message.content })}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-signalInk transition hover:bg-surface"
          >
            <Volume2 aria-hidden="true" className="h-4 w-4" />
            {t('history.replay')}
          </button>
        )}
      </div>
      <p className="mt-1 text-ink">{message.content}</p>
    </li>
  );
}
