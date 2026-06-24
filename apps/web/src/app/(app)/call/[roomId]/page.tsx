'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Captions,
  CaptionsOff,
  Hand,
  PhoneOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { useT, type TFunction } from '@/lib/i18n/use-translation';
import { useCall, type CallStatus } from '@/lib/call/use-call';

function statusText(t: TFunction, status: CallStatus): string {
  const map: Record<CallStatus, string> = {
    idle: t('call.status.idle'),
    connecting: t('call.status.connecting'),
    connected: t('call.status.connected'),
    reconnecting: t('call.status.reconnecting'),
    ended: t('call.status.ended'),
    error: t('call.status.error'),
  };
  return map[status];
}

export default function CallRoomPage({ params }: { params: { roomId: string } }) {
  const { settings } = useSettings();
  const t = useT();
  const call = useCall(params.roomId);
  const startedRef = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Start once on mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void call.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = call.localStream;
  }, [call.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = call.remoteStream;
  }, [call.remoteStream]);

  if (call.status === 'ended') {
    return (
      <div className="card mx-auto max-w-md animate-fade-up p-8 text-center">
        <p className="font-display text-xl font-semibold text-ink">{t('call.endedTitle')}</p>
        <p className="mt-1 text-sm text-muted">{t('call.endedNote')}</p>
        <Link href="/history" className="btn-primary mt-4 px-6 py-3">
          {t('call.viewInHistory')}
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Connection status — icon + text, announced politely. */}
      <p aria-live="polite" className="chip mb-3 inline-flex normal-case tracking-normal text-ink">
        {call.status === 'connected' ? (
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-bridge" />
        ) : call.status === 'error' ? (
          <AlertCircle aria-hidden="true" className="h-4 w-4 text-beacon" />
        ) : (
          <Loader2
            aria-hidden="true"
            className={`h-4 w-4 text-muted ${settings.reduceMotion ? '' : 'animate-spin'}`}
          />
        )}
        {call.status === 'error' && call.error ? call.error : statusText(t, call.status)}
      </p>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-ink shadow-soft">
        {/* Remote video (large). */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          aria-label={t('call.remoteVideo')}
          className="aspect-video w-full bg-ink object-cover"
        />

        {!call.remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center text-canvas/80">
            <p>{statusText(t, call.status)}</p>
          </div>
        )}

        {/* Captions overlay (large, high-contrast, text-scale aware). */}
        {call.captionsEnabled && call.captions && (
          <div
            aria-live="polite"
            aria-label={t('call.liveCaptions')}
            className="absolute inset-x-0 bottom-0 bg-ink/70 px-4 py-3 text-center text-xl font-semibold text-canvas"
          >
            {call.captions}
          </div>
        )}

        {/* Sign overlay. */}
        {call.signEnabled && call.remoteSign && (
          <div
            aria-live="polite"
            aria-label={t('call.recognizedSign')}
            className="absolute left-4 top-4 rounded-lg bg-signal/90 px-3 py-1.5 text-sm font-semibold text-surface"
          >
            {t('call.signPrefix', { sign: call.remoteSign })}
          </div>
        )}

        {/* Local video (picture-in-picture). */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          aria-label={t('call.yourVideo')}
          className="absolute bottom-4 right-4 h-28 w-40 rounded-xl border border-canvas/40 object-cover shadow-lift sm:h-32 sm:w-48"
        />
      </div>

      {/* Controls bar. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ControlButton
          onClick={call.toggleMic}
          pressed={!call.micEnabled}
          label={call.micEnabled ? t('call.muteMic') : t('call.unmuteMic')}
          icon={call.micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          text={call.micEnabled ? t('call.micOn') : t('call.micOff')}
        />
        <ControlButton
          onClick={call.toggleCamera}
          pressed={!call.cameraEnabled}
          label={call.cameraEnabled ? t('call.cameraOffAction') : t('call.cameraOnAction')}
          icon={
            call.cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />
          }
          text={call.cameraEnabled ? t('call.cameraOn') : t('call.cameraOff')}
        />
        <ControlButton
          onClick={call.toggleCaptions}
          pressed={call.captionsEnabled}
          label={call.captionsEnabled ? t('call.captionsOffAction') : t('call.captionsOnAction')}
          icon={
            call.captionsEnabled ? (
              <Captions className="h-5 w-5" />
            ) : (
              <CaptionsOff className="h-5 w-5" />
            )
          }
          text={call.captionsEnabled ? t('call.captionsOn') : t('call.captionsOff')}
        />
        <ControlButton
          onClick={call.toggleSignOverlay}
          pressed={call.signEnabled}
          label={call.signEnabled ? t('call.signOffAction') : t('call.signOnAction')}
          icon={<Hand className="h-5 w-5" />}
          text={call.signEnabled ? t('call.signOn') : t('call.signOff')}
        />
        <button
          type="button"
          onClick={call.endCall}
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-beacon px-6 py-2.5 font-medium text-surface shadow-lift transition hover:opacity-90"
        >
          <PhoneOff aria-hidden="true" className="h-5 w-5" />
          {t('call.endCall')}
        </button>
      </div>

      {!call.sttSupported && call.captionsEnabled && (
        <p className="mt-3 text-sm text-muted">{t('call.sttUnsupported')}</p>
      )}
    </div>
  );
}

function ControlButton({
  onClick,
  pressed,
  label,
  icon,
  text,
}: {
  onClick: () => void;
  pressed: boolean;
  label: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-soft transition ${
        pressed
          ? 'border-signal bg-aurora-soft text-signalInk ring-1 ring-inset ring-signal/20'
          : 'border-line bg-surface text-ink hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-lift'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {text}
    </button>
  );
}
