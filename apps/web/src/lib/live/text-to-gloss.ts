import type { IslGlossToken } from '@signbridge/shared-types';
import { ISL_VOCABULARY, displayLabel, type IslLabel } from '@/lib/sign/vocabulary';

const VOCAB = new Set<string>(ISL_VOCABULARY);

/**
 * Light synonym map so everyday phrasing still maps to known signs. Extend
 * freely — this is intentionally simple for the MVP.
 */
const SYNONYMS: Record<string, IslLabel> = {
  thanks: 'thank_you',
  thankyou: 'thank_you',
  hi: 'hello',
  hey: 'hello',
  yeah: 'yes',
  yep: 'yes',
  yup: 'yes',
  nope: 'no',
  nah: 'no',
  me: 'i',
  halt: 'stop',
};

/** Normalizes text to lowercase word tokens, merging known multi-word signs. */
function normalize(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    // Merge known multi-word labels before splitting on whitespace.
    .replace(/\bthank\s+you\b/g, 'thank_you');
  return cleaned.split(/\s+/).filter(Boolean);
}

function tokenToLabel(token: string): IslLabel | null {
  if (VOCAB.has(token)) return token as IslLabel;
  const syn = SYNONYMS[token];
  if (syn && VOCAB.has(syn)) return syn;
  return null;
}

/**
 * Converts free text into ISL gloss tokens by matching normalized words to the
 * known vocabulary. Matched tokens carry their sign label; unmatched tokens are
 * passed through as plain text (a fingerspell placeholder for now).
 *
 * // Phase 8: avatar renderer replaces the gloss cards rendered from this.
 */
export function textToISL(text: string): IslGlossToken[] {
  return normalize(text).map((token) => {
    const label = tokenToLabel(token);
    return {
      text: label ? displayLabel(label) : token,
      label,
      known: label !== null,
    };
  });
}
