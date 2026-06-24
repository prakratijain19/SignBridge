import type { LanguageCode, TranslateResult } from '@signbridge/shared-types';
import { env } from '../../config/env.js';
import { identityProvider } from './identity.js';
import { bhashiniProvider } from './bhashini.js';
import { googleFreeProvider } from './google-free.js';
import type { TranslationProvider } from './types.js';

function selectProvider(): TranslationProvider {
  switch (env.TRANSLATION_PROVIDER) {
    case 'bhashini':
      return bhashiniProvider;
    case 'identity':
      return identityProvider;
    case 'google-free':
    default:
      return googleFreeProvider;
  }
}

const provider: TranslationProvider = selectProvider();

/**
 * Translates text using the configured provider. Short-circuits when source and
 * target match, and never throws — callers always get a usable result.
 */
export async function translate(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<TranslateResult> {
  if (from === to) {
    return { text, from, to, translated: false, provider: provider.name };
  }
  try {
    return await provider.translate(text, from, to);
  } catch {
    return { text, from, to, translated: false, provider: provider.name };
  }
}

export { provider };
