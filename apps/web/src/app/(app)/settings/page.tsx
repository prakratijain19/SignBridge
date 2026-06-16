'use client';

import { useState } from 'react';
import type { LanguageCode, TextScale } from '@signbridge/shared-types';
import { useSettings } from '@/lib/settings-context';
import { PageHeader } from '@/components/PageHeader';

const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

const TEXT_SIZES: { value: TextScale; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'LARGE', label: 'Large' },
  { value: 'LARGER', label: 'Larger' },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [error, setError] = useState<string | null>(null);

  async function change<K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
  ) {
    setError(null);
    try {
      await updateSettings({ [key]: value });
    } catch {
      setError('Could not save that change. Please try again.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        context="Tune SignBridge to work the way you do. Changes apply right away and are saved to your account."
      />

      {error && (
        <p role="alert" className="mb-6 rounded-lg border border-beacon/40 bg-beacon/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="space-y-8">
        <section className="rounded-xl border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Language</h2>
          <div className="mt-4 max-w-sm">
            {/* i18n: Phase 7 — this preference sets <html lang> now; full UI string
                translation hooks in with the multilingual engine. */}
            <label htmlFor="language" className="block text-sm font-medium text-ink">
              Interface language
            </label>
            <select
              id="language"
              value={settings.interfaceLanguage}
              onChange={(e) => change('interfaceLanguage', e.target.value as LanguageCode)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted">
              Full translation of the interface arrives in a later phase.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Display</h2>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-ink">Text size</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Text size">
              {TEXT_SIZES.map((size) => {
                const active = settings.textScale === size.value;
                return (
                  <button
                    key={size.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => change('textScale', size.value)}
                    className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-signal bg-canvas text-signalInk'
                        : 'border-line bg-surface text-ink hover:bg-canvas'
                    }`}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 divide-y divide-line border-t border-line">
            <ToggleRow
              label="High contrast"
              description="Stronger borders and higher-contrast text."
              checked={settings.highContrast}
              onChange={(v) => change('highContrast', v)}
            />
            <ToggleRow
              label="Reduce motion"
              description="Minimise animations and transitions across the app."
              checked={settings.reduceMotion}
              onChange={(v) => change('reduceMotion', v)}
            />
            <ToggleRow
              label="Captions"
              description="Show captions in conversations and calls (used by later features)."
              checked={settings.captionsEnabled}
              onChange={(v) => change('captionsEnabled', v)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-sm text-muted">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
          checked ? 'border-bridge bg-bridge' : 'border-line bg-canvas'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
