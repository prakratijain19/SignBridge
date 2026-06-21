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

export function displayLabel(label: IslLabel): string {
  return LABEL_DISPLAY[label] ?? label;
}
