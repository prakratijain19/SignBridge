import type { LanguageCode, TranslateResult } from '@signbridge/shared-types';
import type { TranslationProvider } from './types.js';

// Free, unauthenticated Google Translate web endpoint. No API key or signup.
const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0 Safari/537.36';

// Small LRU for repeated phrases, keyed by `${from}:${to}:${text}`.
const LRU_MAX = 500;
const lru = new Map<string, string>();

function lruGet(key: string): string | undefined {
  const value = lru.get(key);
  if (value !== undefined) {
    lru.delete(key);
    lru.set(key, value); // mark most-recently-used
  }
  return value;
}

function lruSet(key: string, value: string): void {
  if (lru.has(key)) lru.delete(key);
  lru.set(key, value);
  if (lru.size > LRU_MAX) {
    const oldest = lru.keys().next().value;
    if (oldest !== undefined) lru.delete(oldest);
  }
}

/** One direct translation call. Returns the translated text, or null on any failure. */
async function computeOnce(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<string | null> {
  const url = `${ENDPOINT}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    // Expected shape: [ [ [translatedChunk, sourceChunk, ...], ... ], ... ]
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    let out = '';
    for (const segment of data[0] as unknown[]) {
      if (Array.isArray(segment) && typeof segment[0] === 'string') {
        out += segment[0];
      }
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

/** Translates, pivoting through English only if a direct Indic↔Indic call fails. */
async function computeWithPivot(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<string | null> {
  const direct = await computeOnce(text, from, to);
  if (direct !== null) return direct;

  if (from !== 'en' && to !== 'en') {
    const english = await computeOnce(text, from, 'en');
    if (english === null) return null;
    return computeOnce(english, 'en', to);
  }
  return null;
}

export const googleFreeProvider: TranslationProvider = {
  name: 'google-free',
  async translate(text: string, from: LanguageCode, to: LanguageCode): Promise<TranslateResult> {
    const fallback: TranslateResult = {
      text,
      from,
      to,
      translated: false,
      provider: 'google-free',
    };

    const key = `${from}:${to}:${text}`;
    const cached = lruGet(key);
    if (cached !== undefined) {
      return { text: cached, from, to, translated: true, provider: 'google-free' };
    }

    const translated = await computeWithPivot(text, from, to);
    if (translated === null || translated.trim() === '') return fallback;

    lruSet(key, translated);
    return { text: translated, from, to, translated: true, provider: 'google-free' };
  },
};
