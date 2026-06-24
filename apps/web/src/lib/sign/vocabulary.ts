// SignBridge ISL recognition vocabulary (MVP — static signs).
//
// IMPORTANT: every label here MUST be verified against the ISLRTC Indian Sign
// Language dictionary, and ideally reviewed with a Deaf consultant, before this
// is used for anything beyond a prototype. This is a candidate starting set.
//
// To add or remove a label, edit ISL_VOCABULARY in @signbridge/shared-types —
// it is the single source of truth shared by collection, inference, and the
// Python trainer. This module just re-exports it plus friendly display labels.

import { ISL_VOCABULARY, type IslLabel } from '@signbridge/shared-types';

export { ISL_VOCABULARY };
export type { IslLabel };

/** Human-friendly display text for each label. */
export const LABEL_DISPLAY: Record<IslLabel, string> = {
  hello: 'Hello',
  yes: 'Yes',
  no: 'No',
  thank_you: 'Thank you',
  please: 'Please',
  help: 'Help',
  stop: 'Stop',
  i: 'I',
  you: 'You',
  good: 'Good',
  eat: 'Eat',
  drink: 'Drink',
  water: 'Water',
  name: 'Name',
  more: 'More',
};

/**
 * Formats an arbitrary label for display: underscores → spaces, words
 * capitalized. Used as the fallback for labels that aren't in the curated
 * vocabulary — e.g. a model trained from a dataset of letters/words whose
 * labels come entirely from the trained model's labels.json.
 */
export function prettyLabel(raw: string): string {
  return raw
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Display text for a label. Known vocabulary labels use their curated label;
 * anything else (including dataset-trained labels) is formatted generically, so
 * the recognizer works with arbitrary labels without code changes.
 */
export function displayLabel(label: string): string {
  return LABEL_DISPLAY[label as IslLabel] ?? prettyLabel(label);
}
