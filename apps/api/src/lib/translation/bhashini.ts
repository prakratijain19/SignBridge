import type { LanguageCode, TranslateResult } from '@signbridge/shared-types';
import { env } from '../../config/env.js';
import type { TranslationProvider } from './types.js';

const CONFIG_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';

interface PipelineConfig {
  serviceId: string;
  callbackUrl: string;
  apiKeyName: string;
  apiKeyValue: string;
}

let cachedConfig: PipelineConfig | null = null;

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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Fetches and caches the Bhashini pipeline config. Returns null on any failure. */
async function getPipelineConfig(): Promise<PipelineConfig | null> {
  if (cachedConfig) return cachedConfig;
  if (!env.BHASHINI_USER_ID || !env.BHASHINI_API_KEY) return null;

  try {
    const res = await fetch(CONFIG_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        userID: env.BHASHINI_USER_ID,
        ulcaApiKey: env.BHASHINI_API_KEY,
      },
      body: JSON.stringify({
        pipelineTasks: [{ taskType: 'translation' }],
        pipelineRequestConfig: { pipelineId: env.BHASHINI_PIPELINE_ID },
      }),
    });
    if (!res.ok) return null;

    const data = asRecord(await res.json());
    const responseConfig = data?.['pipelineResponseConfig'];
    const firstTask = Array.isArray(responseConfig) ? asRecord(responseConfig[0]) : undefined;
    const configList = firstTask?.['config'];
    const firstConfig = Array.isArray(configList) ? asRecord(configList[0]) : undefined;
    const serviceId = firstConfig?.['serviceId'];

    const endpoint = asRecord(data?.['pipelineInferenceAPIEndPoint']);
    const callbackUrl = endpoint?.['callbackUrl'];
    const apiKey = asRecord(endpoint?.['inferenceApiKey']);
    const apiKeyName = apiKey?.['name'];
    const apiKeyValue = apiKey?.['value'];

    if (
      typeof serviceId !== 'string' ||
      typeof callbackUrl !== 'string' ||
      typeof apiKeyName !== 'string' ||
      typeof apiKeyValue !== 'string'
    ) {
      return null;
    }

    cachedConfig = { serviceId, callbackUrl, apiKeyName, apiKeyValue };
    return cachedConfig;
  } catch {
    return null;
  }
}

/** One direct compute call. Returns translated text, or null on any failure. */
async function computeOnce(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<string | null> {
  const config = await getPipelineConfig();
  if (!config) return null;

  try {
    const res = await fetch(config.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [config.apiKeyName]: config.apiKeyValue,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: { sourceLanguage: from, targetLanguage: to },
              serviceId: config.serviceId,
            },
          },
        ],
        inputData: { input: [{ source: text }] },
      }),
    });

    // Stale auth/config — drop the cache so the next call refetches.
    if (res.status === 401 || res.status === 403) {
      cachedConfig = null;
      return null;
    }
    if (!res.ok) return null;

    const data = asRecord(await res.json());
    const pipelineResponse = data?.['pipelineResponse'];
    const firstTask = Array.isArray(pipelineResponse) ? asRecord(pipelineResponse[0]) : undefined;
    const output = firstTask?.['output'];
    const firstOutput = Array.isArray(output) ? asRecord(output[0]) : undefined;
    const target = firstOutput?.['target'];
    return typeof target === 'string' ? target : null;
  } catch {
    return null;
  }
}

/** Translates, pivoting through English for Indic↔Indic pairs. */
async function computeWithPivot(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<string | null> {
  if (from !== 'en' && to !== 'en') {
    const english = await computeOnce(text, from, 'en');
    if (english === null) return null;
    return computeOnce(english, 'en', to);
  }
  return computeOnce(text, from, to);
}

export const bhashiniProvider: TranslationProvider = {
  name: 'bhashini',
  async translate(text: string, from: LanguageCode, to: LanguageCode): Promise<TranslateResult> {
    const fallback: TranslateResult = { text, from, to, translated: false, provider: 'bhashini' };

    const key = `${from}:${to}:${text}`;
    const cached = lruGet(key);
    if (cached !== undefined) {
      return { text: cached, from, to, translated: true, provider: 'bhashini' };
    }

    const translated = await computeWithPivot(text, from, to);
    if (translated === null || translated.trim() === '') return fallback;

    lruSet(key, translated);
    return { text: translated, from, to, translated: true, provider: 'bhashini' };
  },
};
