import type { LanguageCode } from '@signbridge/shared-types';
import type { TranslationProvider } from './types.js';

/** Passthrough provider: returns the original text, used when no key is set. */
export const identityProvider: TranslationProvider = {
  name: 'identity',
  async translate(text: string, from: LanguageCode, to: LanguageCode) {
    return { text, from, to, translated: false, provider: 'identity' };
  },
};
