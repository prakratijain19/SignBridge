'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CircleHelp,
  Ambulance,
  EarOff,
  Stethoscope,
  Shield,
  Flame,
  MapPin,
  Wind,
  Bandage,
  PenLine,
  Pill,
  MessagesSquare,
  TriangleAlert,
  Volume2,
  Phone,
  MessageSquare,
  Plus,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from 'lucide-react';
import {
  EMERGENCY_PHRASES,
  type EmergencyContact,
  type LanguageCode,
  type QuickPhrase,
} from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { PageHeader } from '@/components/PageHeader';
import { useTextToSpeech } from '@/lib/speech/use-text-to-speech';
import { useT } from '@/lib/i18n/use-translation';
import { translate } from '@/lib/translation-api';
import {
  createContact,
  createPhrase,
  deleteContact,
  deletePhrase,
  listContacts,
  listPhrases,
  logEvent,
  updateContact,
  updatePhrase,
  type ContactInput,
} from '@/lib/emergency-api';

const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'gu', label: 'ગુજરાતી' },
];

const PHRASE_ICONS: Record<string, LucideIcon> = {
  CircleHelp,
  Ambulance,
  EarOff,
  Stethoscope,
  Shield,
  Flame,
  MapPin,
  Wind,
  Bandage,
  PenLine,
  Pill,
  MessagesSquare,
};

export default function EmergencyPage() {
  const t = useT();
  const { authFetch } = useAuth();
  const { settings } = useSettings();
  const tts = useTextToSpeech();

  const [lang, setLang] = useState<LanguageCode>(settings.interfaceLanguage);
  const [banner, setBanner] = useState<string>('');

  /** Speak + display + log a phrase. The core emergency action. */
  const activate = useCallback(
    (text: string, language: LanguageCode) => {
      setBanner(text);
      if (tts.supported) void tts.speak(text, { lang: language });
      void logEvent(authFetch, { text, language, channel: 'spoken' }).catch(() => {
        /* logging is best-effort and must never block the emergency action */
      });
    },
    [authFetch, tts],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('emergency.main.title')} context={t('emergency.main.context')} />

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="emergency-lang" className="text-sm font-medium text-ink">
          {t('emergency.main.languageLabel')}
        </label>
        <select
          id="emergency-lang"
          value={lang}
          onChange={(e) => setLang(e.target.value as LanguageCode)}
          className="min-h-11 rounded-xl border border-line bg-surface px-3 text-ink transition focus:border-signal"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <Link href="/emergency/history" className="btn-secondary ml-auto text-sm">
          {t('emergency.main.historyLink')}
        </Link>
      </div>

      {/* Large output banner — assertive so it interrupts and is read at once. */}
      <div
        aria-live="assertive"
        className={`mb-6 min-h-24 rounded-2xl border-2 p-6 text-center text-3xl font-bold shadow-soft sm:text-4xl ${
          banner ? 'border-beacon bg-beacon/10 text-ink' : 'border-line bg-surface text-muted'
        }`}
      >
        {banner || t('emergency.main.bannerPlaceholder')}
      </div>

      <BuiltInPanel lang={lang} onActivate={activate} reduceMotion={settings.reduceMotion} />

      <QuickPhrasesPanel authFetch={authFetch} lang={lang} onActivate={activate} />

      <ContactsPanel authFetch={authFetch} />
    </div>
  );
}

// ── Built-in phrases ──────────────────────────────────────────────────────────

function BuiltInPanel({
  lang,
  onActivate,
  reduceMotion,
}: {
  lang: LanguageCode;
  onActivate: (text: string, language: LanguageCode) => void;
  reduceMotion: boolean;
}) {
  const t = useT();
  return (
    <section aria-labelledby="builtin-heading" className="mb-8">
      <h2
        id="builtin-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted"
      >
        {t('emergency.main.builtinHeading')}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {EMERGENCY_PHRASES.map((phrase) => {
          const Icon = (phrase.icon && PHRASE_ICONS[phrase.icon]) || TriangleAlert;
          const text = phrase.text[lang];
          return (
            <button
              key={phrase.id}
              type="button"
              onClick={() => onActivate(text, lang)}
              className={`flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-beacon bg-beacon/10 p-3 text-center font-semibold text-ink shadow-soft ${
                reduceMotion ? '' : 'transition hover:-translate-y-0.5 hover:shadow-lift'
              } hover:bg-beacon/20`}
            >
              <Icon aria-hidden="true" className="h-7 w-7 text-beacon" />
              <span className="text-base leading-tight">{text}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Quick phrases (user CRUD) ──────────────────────────────────────────────────

function QuickPhrasesPanel({
  authFetch,
  lang,
  onActivate,
}: {
  authFetch: ReturnType<typeof useAuth>['authFetch'];
  lang: LanguageCode;
  onActivate: (text: string, language: LanguageCode) => void;
}) {
  const t = useT();
  const [phrases, setPhrases] = useState<QuickPhrase[]>([]);
  const [text, setText] = useState('');
  const [phraseLang, setPhraseLang] = useState<LanguageCode>(lang);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { phrases: list } = await listPhrases(authFetch);
      setPhrases(list);
    } catch {
      /* non-fatal */
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await createPhrase(authFetch, {
        text: text.trim(),
        language: phraseLang,
        sortOrder: phrases.length,
      });
      setText('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await deletePhrase(authFetch, id);
    setPhrases((prev) => prev.filter((p) => p.id !== id));
  }

  async function move(index: number, dir: -1 | 1) {
    const other = index + dir;
    if (other < 0 || other >= phrases.length) return;
    const a = phrases[index]!;
    const b = phrases[other]!;
    await Promise.all([
      updatePhrase(authFetch, a.id, { sortOrder: b.sortOrder }),
      updatePhrase(authFetch, b.id, { sortOrder: a.sortOrder }),
    ]);
    await load();
  }

  /** Speak a quick phrase in the selected output language (translate if needed). */
  async function speakPhrase(p: QuickPhrase) {
    if (p.language === lang) {
      onActivate(p.text, lang);
      return;
    }
    const res = await translate(authFetch, { text: p.text, from: p.language, to: lang });
    onActivate(res.text, res.translated ? lang : p.language);
  }

  return (
    <section aria-labelledby="quick-heading" className="mb-8">
      <h2
        id="quick-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted"
      >
        {t('emergency.main.quickHeading')}
      </h2>

      <div className="card p-6">
        {phrases.length > 0 && (
          <ul className="mb-3 space-y-2">
            {phrases.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface p-2 transition hover:shadow-soft"
              >
                <button
                  type="button"
                  onClick={() => void speakPhrase(p)}
                  className="flex min-h-12 flex-1 items-center gap-2 rounded-xl px-3 text-left font-medium text-ink transition hover:bg-canvas"
                >
                  <Volume2 aria-hidden="true" className="h-5 w-5 shrink-0 text-signalInk" />
                  {p.text}
                  <span className="chip ml-1">{p.language}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void move(i, -1)}
                  disabled={i === 0}
                  aria-label={t('emergency.main.moveUp', { text: p.text })}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-canvas disabled:opacity-40"
                >
                  <ArrowUp aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => void move(i, 1)}
                  disabled={i === phrases.length - 1}
                  aria-label={t('emergency.main.moveDown', { text: p.text })}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-canvas disabled:opacity-40"
                >
                  <ArrowDown aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(p.id)}
                  aria-label={t('emergency.main.deletePhrase', { text: p.text })}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-canvas hover:text-beacon"
                >
                  <Trash2 aria-hidden="true" className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label htmlFor="new-phrase" className="block text-sm font-medium text-ink">
              {t('emergency.main.addPhraseLabel')}
            </label>
            <input
              id="new-phrase"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal"
              placeholder={t('emergency.main.addPhrasePlaceholder')}
            />
          </div>
          <select
            aria-label={t('emergency.main.phraseLanguageLabel')}
            value={phraseLang}
            onChange={(e) => setPhraseLang(e.target.value as LanguageCode)}
            className="min-h-11 rounded-xl border border-line bg-surface px-2 text-ink transition focus:border-signal"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy || !text.trim()} className="btn-secondary min-h-11">
            <Plus aria-hidden="true" className="h-5 w-5" />
            {t('emergency.main.add')}
          </button>
        </form>
      </div>
    </section>
  );
}

// ── Emergency contacts ──────────────────────────────────────────────────────

function ContactsPanel({ authFetch }: { authFetch: ReturnType<typeof useAuth>['authFetch'] }) {
  const t = useT();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [form, setForm] = useState<ContactInput>({ name: '', phone: '', relation: '' });
  const [busy, setBusy] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { contacts: list } = await listContacts(authFetch);
      setContacts(list);
    } catch {
      /* non-fatal */
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setBusy(true);
    try {
      await createContact(authFetch, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        relation: form.relation?.trim() || undefined,
        isPrimary: contacts.length === 0,
      });
      setForm({ name: '', phone: '', relation: '' });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function makePrimary(id: string) {
    await updateContact(authFetch, id, { isPrimary: true });
    await load();
  }

  async function remove(id: string) {
    await deleteContact(authFetch, id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  const primary = contacts.find((c) => c.isPrimary) ?? contacts[0];

  function shareLocation() {
    if (!primary) {
      setLocationNote(t('emergency.main.locationNeedContact'));
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationNote(t('emergency.main.locationUnavailable'));
      return;
    }
    setLocationNote(t('emergency.main.locationGetting'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const maps = `https://maps.google.com/?q=${latitude},${longitude}`;
        const body = encodeURIComponent(t('emergency.main.locationMessage', { maps }));
        setLocationNote(null);
        window.location.href = `sms:${primary.phone}?body=${body}`;
      },
      () => setLocationNote(t('emergency.main.locationError')),
    );
  }

  return (
    <section aria-labelledby="contacts-heading" className="mb-8">
      <h2
        id="contacts-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted"
      >
        {t('emergency.main.contactsHeading')}
      </h2>

      <div className="card p-6">
        {contacts.length > 0 && (
          <ul className="mb-3 space-y-2">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-line bg-surface p-3 transition hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">
                    {c.name}
                    {c.isPrimary && (
                      <span className="chip ml-2">{t('emergency.main.primaryBadge')}</span>
                    )}
                    {c.relation && <span className="ml-2 text-sm text-muted">{c.relation}</span>}
                  </span>
                  <span className="flex items-center gap-1">
                    {!c.isPrimary && (
                      <button
                        type="button"
                        onClick={() => void makePrimary(c.id)}
                        aria-label={t('emergency.main.makePrimary', { name: c.name })}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-canvas"
                      >
                        <Star aria-hidden="true" className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void remove(c.id)}
                      aria-label={t('emergency.main.deleteContact', { name: c.name })}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-canvas hover:text-beacon"
                    >
                      <Trash2 aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`tel:${c.phone}`}
                    aria-label={t('emergency.main.callContact', { name: c.name })}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-beacon px-4 font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <Phone aria-hidden="true" className="h-5 w-5" />
                    {t('emergency.main.call')}
                  </a>
                  <a
                    href={`sms:${c.phone}`}
                    aria-label={t('emergency.main.textContact', { name: c.name })}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-canvas hover:shadow-lift"
                  >
                    <MessageSquare aria-hidden="true" className="h-5 w-5" />
                    {t('emergency.main.text')}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={shareLocation} className="btn-secondary mb-3 min-h-12">
          <MapPin aria-hidden="true" className="h-5 w-5 text-beacon" />
          {t('emergency.main.shareLocation')}
        </button>
        {locationNote && (
          <p role="status" className="mb-3 text-sm text-muted">
            {locationNote}
          </p>
        )}

        <form onSubmit={add} className="grid gap-2 sm:grid-cols-3">
          <input
            aria-label={t('emergency.main.contactNameLabel')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('emergency.main.contactNamePlaceholder')}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal"
          />
          <input
            aria-label={t('emergency.main.contactPhoneLabel')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={t('emergency.main.contactPhonePlaceholder')}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal"
          />
          <div className="flex gap-2">
            <input
              aria-label={t('emergency.main.contactRelationLabel')}
              value={form.relation ?? ''}
              onChange={(e) => setForm({ ...form, relation: e.target.value })}
              placeholder={t('emergency.main.contactRelationPlaceholder')}
              className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal"
            />
            <button
              type="submit"
              disabled={busy || !form.name.trim() || !form.phone.trim()}
              className="btn-secondary min-h-11"
            >
              <Plus aria-hidden="true" className="h-5 w-5" />
              {t('emergency.main.add')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
