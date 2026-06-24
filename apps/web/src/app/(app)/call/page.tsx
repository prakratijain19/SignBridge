'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, Copy, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/use-translation';
import { PageHeader } from '@/components/PageHeader';
import { createCall } from '@/lib/call/calls-api';

export default function CallStartPage() {
  const { authFetch } = useAuth();
  const t = useT();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function startCall() {
    setCreating(true);
    setError(null);
    try {
      const res = await createCall(authFetch);
      // Stash this participant's conversation + ICE so the room page reuses them.
      sessionStorage.setItem(
        `call:${res.roomId}`,
        JSON.stringify({ conversationId: res.conversationId, iceServers: res.iceServers }),
      );
      setRoomId(res.roomId);
    } catch {
      setError(t('call.startError'));
    } finally {
      setCreating(false);
    }
  }

  const link = roomId ? `${window.location.origin}/call/${roomId}` : '';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('call.title')} context={t('call.context')} />

      {!roomId ? (
        <div className="card p-6">
          <div aria-hidden="true" className="icon-tile mb-4 h-12 w-12">
            <Video className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={startCall}
            disabled={creating}
            className="btn-primary px-6 py-3 disabled:opacity-60"
          >
            <Video aria-hidden="true" className="h-5 w-5" />
            {creating ? t('call.starting') : t('call.startCall')}
          </button>
          {error && (
            <p role="alert" className="mt-3 text-sm text-beacon">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="card p-6">
          <p className="font-medium text-ink">{t('call.shareLink')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="call-link" className="sr-only">
              {t('call.linkLabel')}
            </label>
            <input
              id="call-link"
              readOnly
              value={link}
              className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-ink transition focus:border-signal"
            />
            <button type="button" onClick={copyLink} className="btn-secondary">
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4 text-bridge" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4" />
              )}
              {copied ? t('call.copied') : t('call.copy')}
            </button>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/call/${roomId}`)}
            className="btn-primary mt-4 px-6 py-3"
          >
            {t('call.enterCall')}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
