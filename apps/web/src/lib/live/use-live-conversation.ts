'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
  IslGlossToken,
  LanguageCode,
  LiveSeat,
  MessageModality,
  MessageSender,
} from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSpeechToText } from '@/lib/speech/use-speech-to-text';
import { cancelSpeech, recognitionSupported } from '@/lib/speech/speech-service';
import { useSignRecognition } from '@/lib/sign/use-sign-recognition';
import type { HandResult } from '@/lib/sign/landmark-features';
import { displayLabel } from '@/lib/sign/vocabulary';
import { addMessage, createConversation } from '@/lib/conversations-api';
import { speakText, textToISL, ttsSupported } from './pipeline';

/**
 * Seat → message mapping (documented per spec):
 *   - Speech seat (hearing participant) → modality SPEECH, sender PARTNER
 *   - Sign seat   (Deaf participant)    → modality SIGN,   sender USER
 */
const SEAT_SENDER: Record<LiveSeat, MessageSender> = { speech: 'PARTNER', sign: 'USER' };
const SEAT_MODALITY: Record<LiveSeat, MessageModality> = { speech: 'SPEECH', sign: 'SIGN' };

// Sign recognition produces English gloss labels (e.g. "Hello"), so sign turns
// are recorded as English regardless of the UI/interface language.
const SIGN_LANGUAGE: LanguageCode = 'en';

export interface LiveTurn {
  id: string;
  seat: LiveSeat;
  sender: MessageSender;
  modality: MessageModality;
  language: LanguageCode;
  content: string;
  gloss?: IslGlossToken[];
}

interface Options {
  videoRef: RefObject<HTMLVideoElement>;
  onFrame?: (hands: HandResult[]) => void;
  /** Language the Speaking participant is speaking in (drives STT + stored language). */
  speakingLang: LanguageCode;
}

export function useLiveConversation({ videoRef, onFrame, speakingLang }: Options) {
  const { authFetch } = useAuth();
  const speechSupported = recognitionSupported();
  const speakingSupported = ttsSupported();

  const [transcript, setTranscript] = useState<LiveTurn[]>([]);
  const [activeSeat, setActiveSeatState] = useState<LiveSeat>('speech');
  const [started, setStarted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const turnCounter = useRef(0);
  const conversationIdRef = useRef<string | null>(null);
  const ensureRef = useRef<Promise<string> | null>(null);
  const startedRef = useRef(false);
  const activeSeatRef = useRef<LiveSeat>('speech');

  const ensureConversation = useCallback((): Promise<string> => {
    if (conversationIdRef.current) return Promise.resolve(conversationIdRef.current);
    if (!ensureRef.current) {
      ensureRef.current = createConversation(authFetch, { mode: 'LIVE' }).then(
        ({ conversation }) => {
          conversationIdRef.current = conversation.id;
          setConversationId(conversation.id);
          return conversation.id;
        },
      );
    }
    return ensureRef.current;
  }, [authFetch]);

  const persist = useCallback(
    (seat: LiveSeat, content: string, language: LanguageCode) => {
      void (async () => {
        try {
          const id = await ensureConversation();
          await addMessage(authFetch, id, {
            sender: SEAT_SENDER[seat],
            modality: SEAT_MODALITY[seat],
            language,
            content,
          });
        } catch {
          // Best-effort persistence; the live transcript still updates.
        }
      })();
    },
    [authFetch, ensureConversation],
  );

  const pushTurn = useCallback((turn: Omit<LiveTurn, 'id'>) => {
    turnCounter.current += 1;
    setTranscript((prev) => [...prev, { ...turn, id: `turn-${turnCounter.current}` }]);
  }, []);

  const handleSpeechFinal = useCallback(
    (text: string) => {
      // The turn is recorded in the language actually spoken (the STT language),
      // NOT the UI/interface language. Display-time translation handles the rest.
      const gloss = textToISL(text);
      pushTurn({
        seat: 'speech',
        sender: SEAT_SENDER.speech,
        modality: SEAT_MODALITY.speech,
        language: speakingLang,
        content: text,
        gloss,
      });
      persist('speech', text, speakingLang);
    },
    [persist, pushTurn, speakingLang],
  );

  const handleSignStable = useCallback(
    (label: string) => {
      const text = displayLabel(label);
      pushTurn({
        seat: 'sign',
        sender: SEAT_SENDER.sign,
        modality: SEAT_MODALITY.sign,
        language: SIGN_LANGUAGE,
        content: text,
      });
      persist('sign', text, SIGN_LANGUAGE);
      // Speak the recognized English gloss aloud for the hearing participant.
      void speakText(text, SIGN_LANGUAGE, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      });
    },
    [persist, pushTurn],
  );

  const speech = useSpeechToText({ lang: speakingLang, onFinal: handleSpeechFinal });
  const sign = useSignRecognition({ videoRef, onStableSign: handleSignStable, onFrame });

  // Stable refs so seat-switching doesn't depend on changing start/stop identities.
  const speechRef = useRef(speech);
  const signRef = useRef(sign);
  speechRef.current = speech;
  signRef.current = sign;

  const stopAllCapture = useCallback(() => {
    speechRef.current.stop();
    signRef.current.stop();
  }, []);

  const startSeatCapture = useCallback(
    (seat: LiveSeat) => {
      if (seat === 'speech') {
        if (speechSupported) speechRef.current.start();
      } else {
        signRef.current.start();
      }
    },
    [speechSupported],
  );

  const setActiveSeat = useCallback(
    (seat: LiveSeat) => {
      activeSeatRef.current = seat;
      setActiveSeatState(seat);
      stopAllCapture();
      cancelSpeech();
      if (startedRef.current) startSeatCapture(seat);
    },
    [startSeatCapture, stopAllCapture],
  );

  const start = useCallback(() => {
    startedRef.current = true;
    setStarted(true);
    void ensureConversation();
    startSeatCapture(activeSeatRef.current);
  }, [ensureConversation, startSeatCapture]);

  const end = useCallback(() => {
    startedRef.current = false;
    setStarted(false);
    stopAllCapture();
    cancelSpeech();
    setSpeaking(false);
  }, [stopAllCapture]);

  // If the speaking language changes while the Speaking seat is actively
  // listening, restart STT so the new recognition language takes effect.
  useEffect(() => {
    if (startedRef.current && activeSeatRef.current === 'speech' && speechSupported) {
      speechRef.current.stop();
      speechRef.current.start();
    }
  }, [speakingLang, speechSupported]);

  // Stop everything on unmount.
  useEffect(
    () => () => {
      speechRef.current.stop();
      signRef.current.stop();
      cancelSpeech();
    },
    [],
  );

  return {
    transcript,
    activeSeat,
    setActiveSeat,
    started,
    start,
    end,
    conversationId,
    speaking,
    speechSupported,
    speakingSupported,
    signModelReady: sign.modelLoaded,
    signModelChecked: sign.modelChecked,
    speech: {
      isListening: speech.isListening,
      interimText: speech.interimText,
      supported: speech.supported,
      error: speech.error,
    },
    sign: {
      running: sign.running,
      currentPrediction: sign.currentPrediction,
      stableLabel: sign.stableLabel,
      supported: sign.supported,
      error: sign.error,
    },
  };
}
