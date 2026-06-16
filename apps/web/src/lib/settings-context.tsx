'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { UserSettings } from '@signbridge/shared-types';
import { useAuth } from './auth-context';
import { fetchSettings, updateSettings as updateSettingsApi } from './users-api';

/** Defaults mirror the Prisma model defaults; used until the real row loads. */
const DEFAULT_SETTINGS: UserSettings = {
  interfaceLanguage: 'en',
  textScale: 'NORMAL',
  highContrast: false,
  reduceMotion: false,
  captionsEnabled: true,
};

interface SettingsContextValue {
  settings: UserSettings;
  isLoading: boolean;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Applies preferences to <html> so they take effect app-wide. */
function applySettings(s: UserSettings): void {
  const root = document.documentElement;
  // i18n: Phase 7 — full UI string translation hooks in here; for now we only
  // set the document language so assistive tech and font selection are correct.
  root.lang = s.interfaceLanguage;
  root.dataset.textScale = s.textScale;
  root.dataset.contrast = s.highContrast ? 'high' : 'off';
  root.dataset.reduceMotion = s.reduceMotion ? 'on' : 'off';
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, authFetch } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Keep latest settings in a ref so updateSettings can revert without
  // depending on (and being recreated by) the settings value.
  const settingsRef = useRef(settings);
  const apply = useCallback((next: UserSettings) => {
    settingsRef.current = next;
    setSettings(next);
    applySettings(next);
  }, []);

  // Load the user's settings once authenticated.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const { settings: loaded } = await fetchSettings(authFetch);
        if (!cancelled) apply(loaded);
      } catch {
        // Fall back to defaults already applied below.
        if (!cancelled) apply(settingsRef.current);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authFetch, apply]);

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      const previous = settingsRef.current;
      const optimistic = { ...previous, ...partial };
      apply(optimistic); // optimistic update
      try {
        const { settings: saved } = await updateSettingsApi(authFetch, partial);
        apply(saved); // re-apply the server's canonical version
      } catch (err) {
        apply(previous); // revert on failure
        throw err;
      }
    },
    [authFetch, apply],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, isLoading, updateSettings }),
    [settings, isLoading, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
