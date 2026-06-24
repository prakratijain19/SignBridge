/**
 * Converts input text into an ordered list of fingerspelling pose steps.
 *
 * Only the English alphabet (A–Z) and digits (0–9) have poses, so this
 * fingerspells letter by letter. Hindi/Gujarati text is detected and reported
 * separately (transliteration is out of scope for this phase).
 */

export interface PoseStep {
  kind: 'letter' | 'pause';
  /** Pose label for letter steps (uppercase A–Z / 0–9). */
  label?: string;
  /** Whether a pose exists for this label. */
  known?: boolean;
  /** Index into the `letters` array this step highlights, or null (repeat gap). */
  letterIndex: number | null;
}

export interface PoseSequence {
  /** Displayed characters (letters/digits/spaces) for the caption. */
  letters: string[];
  steps: PoseStep[];
}

const DEVANAGARI_OR_GUJARATI = /[ऀ-ॿ઀-૿]/;

/** True if the text is Latin/ASCII-spellable (not Devanagari/Gujarati script). */
export function isLatinText(text: string): boolean {
  if (DEVANAGARI_OR_GUJARATI.test(text)) return false;
  return /[a-z0-9]/i.test(text);
}

function isSpellable(ch: string): boolean {
  return /[A-Z0-9]/.test(ch);
}

export function textToPoses(text: string, availableLabels: Set<string>): PoseSequence {
  const letters: string[] = [];
  const steps: PoseStep[] = [];
  let lastLabel: string | null = null;

  for (const raw of text.toUpperCase()) {
    if (raw === ' ' || raw === '\n' || raw === '\t') {
      letters.push(' ');
      steps.push({ kind: 'pause', letterIndex: letters.length - 1 });
      lastLabel = null;
      continue;
    }
    if (!isSpellable(raw)) continue; // skip punctuation/other

    // Separate repeated letters (e.g. "LL") with a brief gap so they read as two.
    if (lastLabel === raw) {
      steps.push({ kind: 'pause', letterIndex: null });
    }
    letters.push(raw);
    steps.push({
      kind: 'letter',
      label: raw,
      known: availableLabels.has(raw),
      letterIndex: letters.length - 1,
    });
    lastLabel = raw;
  }

  return { letters, steps };
}
