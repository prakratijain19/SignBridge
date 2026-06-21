'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LanguageCode } from '@signbridge/shared-types';
import { cancelSpeech, getVoices, speak, ttsSupported } from './speech-service';

export interface UseTextToSpeech {
  speak: (
    text: string,
    opts: { lang: LanguageCode; voiceURI?: string },
  ) => Promise<{ matchedLanguage: boolean }>;
  cancel: () => void;
  speaking: boolean;
  voices: SpeechSynthesisVoice[];
  supported: boolean;
}

export function useTextToSpeech(): UseTextToSpeech {
  const supported = useMemo(() => ttsSupported(), []);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    void getVoices().then((v) => {
      if (!cancelled) setVoices(v);
    });
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const speakText = useCallback(
    (text: string, opts: { lang: LanguageCode; voiceURI?: string }) =>
      speak(text, {
        ...opts,
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      }),
    [],
  );

  const cancel = useCallback(() => {
    cancelSpeech();
    setSpeaking(false);
  }, []);

  // Stop speech if the component using this hook unmounts.
  useEffect(() => () => cancelSpeech(), []);

  return { speak: speakText, cancel, speaking, voices, supported };
}
