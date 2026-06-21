'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LanguageCode } from '@signbridge/shared-types';
import {
  createSpeechRecognizer,
  recognitionSupported,
  type SpeechRecognizer,
} from './speech-service';

interface UseSpeechToTextOptions {
  lang: LanguageCode;
  /** Called once per finalized utterance — used to persist each line. */
  onFinal?: (text: string) => void;
}

export interface UseSpeechToText {
  isListening: boolean;
  interimText: string;
  finalText: string;
  start: () => void;
  stop: () => void;
  supported: boolean;
  error: string | null;
}

export function useSpeechToText({ lang, onFinal }: UseSpeechToTextOptions): UseSpeechToText {
  const supported = useMemo(() => recognitionSupported(), []);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError('not-supported');
      return;
    }
    setError(null);
    setInterimText('');
    // Recreate each session so the current language is applied.
    const recognizer = createSpeechRecognizer({
      lang,
      onInterim: (text) => setInterimText(text),
      onFinal: (text) => {
        setFinalText(text);
        setInterimText('');
        onFinalRef.current?.(text);
      },
      onError: (code) => {
        setError(code);
        setIsListening(false);
        setInterimText('');
      },
      onEnd: () => {
        setIsListening(false);
        setInterimText('');
      },
    });
    recognizerRef.current = recognizer;
    recognizer.start();
    setIsListening(true);
  }, [lang, supported]);

  // Stop any active recognition on unmount.
  useEffect(() => () => recognizerRef.current?.stop(), []);

  return { isListening, interimText, finalText, start, stop, supported, error };
}
