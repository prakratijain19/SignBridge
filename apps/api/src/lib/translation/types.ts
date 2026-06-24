import type { LanguageCode, TranslateResult } from '@signbridge/shared-types';

/**
 * A swappable translation backend. Implementations must NEVER throw to the
 * caller — on any failure they return the original text with `translated: false`.
 */
export interface TranslationProvider {
  readonly name: string;
  translate(text: string, from: LanguageCode, to: LanguageCode): Promise<TranslateResult>;
}
