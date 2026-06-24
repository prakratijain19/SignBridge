'use client';

import { useCallback } from 'react';
import type { LanguageCode } from '@signbridge/shared-types';
import { useSettings } from '@/lib/settings-context';
import { TRANSLATIONS } from './translations';

/** Looks up `key` for the active language, then English, then returns the raw key. */
export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

function translate(
  lang: LanguageCode,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
  let value = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replace(`{${name}}`, String(replacement));
    }
  }
  return value;
}

/**
 * Translation hook driven by the user's interface-language setting. Re-renders
 * consuming components when the language changes, so the UI updates live.
 */
export function useT(): TFunction {
  const { settings } = useSettings();
  const lang = settings.interfaceLanguage;
  return useCallback((key, vars) => translate(lang, key, vars), [lang]);
}
