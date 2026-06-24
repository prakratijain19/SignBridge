'use client';

import { useState } from 'react';
import { ArrowRightLeft, Copy, Volume2, Check, Languages } from 'lucide-react';
import type { LanguageCode } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { PageHeader } from '@/components/PageHeader';
import { translate } from '@/lib/translation-api';
import { useTextToSpeech } from '@/lib/speech/use-text-to-speech';
import { useT } from '@/lib/i18n/use-translation';

const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

const selectClass =
  'mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal';

export default function TranslatePage() {
  const t = useT();
  const { authFetch } = useAuth();
  const { settings } = useSettings();
  const tts = useTextToSpeech();

  const [from, setFrom] = useState<LanguageCode>('en');
  const [to, setTo] = useState<LanguageCode>(settings.interfaceLanguage);
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ text: string; translated: boolean } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [copied, setCopied] = useState(false);

  async function handleTranslate() {
    if (!text.trim()) return;
    setStatus('loading');
    setCopied(false);
    const res = await translate(authFetch, { text: text.trim(), from, to });
    setResult({ text: res.text, translated: res.translated });
    setStatus('idle');
  }

  function swap() {
    setFrom(to);
    setTo(from);
    if (result) {
      setText(result.text);
      setResult(null);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('translate.title')} context={t('translate.context')} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="source-heading" className="card p-6">
          <h2 id="source-heading" className="sr-only">
            {t('translate.sourceText')}
          </h2>
          <label htmlFor="from-lang" className="block text-sm font-medium text-ink">
            {t('translate.from')}
          </label>
          <select
            id="from-lang"
            value={from}
            onChange={(e) => setFrom(e.target.value as LanguageCode)}
            className={selectClass}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <label htmlFor="source-text" className="mt-4 block text-sm font-medium text-ink">
            {t('translate.textToTranslate')}
          </label>
          <textarea
            id="source-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={5000}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
            placeholder={t('translate.textPlaceholder')}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTranslate}
              disabled={!text.trim() || status === 'loading'}
              className="btn-primary gap-2 px-6 py-3 disabled:opacity-60"
            >
              <Languages aria-hidden="true" className="h-5 w-5" />
              {status === 'loading' ? t('translate.translating') : t('translate.translate')}
            </button>
            <button
              type="button"
              onClick={swap}
              aria-label={t('translate.swapAria')}
              className="btn-secondary h-11 w-11 justify-center px-0"
            >
              <ArrowRightLeft aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section aria-labelledby="result-heading" className="card p-6">
          <h2 id="result-heading" className="sr-only">
            {t('translate.resultHeading')}
          </h2>
          <label htmlFor="to-lang" className="block text-sm font-medium text-ink">
            {t('translate.to')}
          </label>
          <select
            id="to-lang"
            value={to}
            onChange={(e) => setTo(e.target.value as LanguageCode)}
            className={selectClass}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Result honors text-scale (rem sizing) and high-contrast tokens. */}
          <div
            aria-live="polite"
            className="mt-4 min-h-28 rounded-xl border border-line bg-canvas p-4 text-2xl leading-relaxed text-ink"
          >
            {status === 'loading' ? (
              <span className="text-base text-muted">{t('translate.translating')}</span>
            ) : result ? (
              result.text
            ) : (
              <span className="text-base text-muted">{t('translate.resultPlaceholder')}</span>
            )}
          </div>

          {result && !result.translated && (
            <p className="mt-2 text-sm text-muted">{t('translate.notConfigured')}</p>
          )}

          {result && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void tts.speak(result.text, { lang: to })}
                disabled={!tts.supported}
                aria-label={t('translate.speakAria')}
                className="btn-secondary gap-2 text-sm disabled:opacity-60"
              >
                <Volume2 aria-hidden="true" className="h-4 w-4" />
                {t('translate.speak')}
              </button>
              <button
                type="button"
                onClick={copy}
                aria-label={t('translate.copyAria')}
                className="btn-secondary gap-2 text-sm"
              >
                {copied ? (
                  <Check aria-hidden="true" className="h-4 w-4 text-bridge" />
                ) : (
                  <Copy aria-hidden="true" className="h-4 w-4" />
                )}
                {copied ? t('translate.copied') : t('translate.copy')}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
