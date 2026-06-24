'use client';

import { useState } from 'react';
import type { LanguageCode, TextScale } from '@signbridge/shared-types';
import { useSettings } from '@/lib/settings-context';
import { useT } from '@/lib/i18n/use-translation';
import { PageHeader } from '@/components/PageHeader';

// Language names are shown in their own script, so they are intentionally not translated.
const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

const TEXT_SIZES: { value: TextScale; labelKey: string }[] = [
  { value: 'NORMAL', labelKey: 'settings.size.normal' },
  { value: 'LARGE', labelKey: 'settings.size.large' },
  { value: 'LARGER', labelKey: 'settings.size.larger' },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  async function change<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    setError(null);
    try {
      await updateSettings({ [key]: value });
    } catch {
      setError(t('settings.saveError'));
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('settings.title')} context={t('settings.subtitle')} />

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-beacon/40 bg-beacon/10 px-4 py-3 text-sm text-ink"
        >
          {error}
        </p>
      )}

      <div className="space-y-8">
        <section className="card p-6">
          <h2 className="font-display text-xl font-semibold text-ink">{t('settings.language')}</h2>
          <div className="mt-4 max-w-sm">
            <label htmlFor="language" className="block text-sm font-medium text-ink">
              {t('settings.interfaceLanguage')}
            </label>
            <select
              id="language"
              value={settings.interfaceLanguage}
              onChange={(e) => change('interfaceLanguage', e.target.value as LanguageCode)}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted">{t('settings.languageNote')}</p>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-xl font-semibold text-ink">{t('settings.display')}</h2>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-ink">{t('settings.textSize')}</legend>
            <div
              className="mt-2 flex flex-wrap gap-2"
              role="radiogroup"
              aria-label={t('settings.textSize')}
            >
              {TEXT_SIZES.map((size) => {
                const active = settings.textScale === size.value;
                return (
                  <button
                    key={size.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => change('textScale', size.value)}
                    className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-signal/20 bg-aurora-soft text-signalInk ring-1 ring-inset ring-signal/20'
                        : 'border-line bg-surface text-ink hover:bg-canvas'
                    }`}
                  >
                    {t(size.labelKey)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 divide-y divide-line border-t border-line">
            <ToggleRow
              label={t('settings.highContrast')}
              description={t('settings.highContrastDesc')}
              checked={settings.highContrast}
              onChange={(v) => change('highContrast', v)}
            />
            <ToggleRow
              label={t('settings.reduceMotion')}
              description={t('settings.reduceMotionDesc')}
              checked={settings.reduceMotion}
              onChange={(v) => change('reduceMotion', v)}
            />
            <ToggleRow
              label={t('settings.captions')}
              description={t('settings.captionsDesc')}
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
          checked ? 'border-transparent bg-aurora shadow-glow' : 'border-line bg-canvas'
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
