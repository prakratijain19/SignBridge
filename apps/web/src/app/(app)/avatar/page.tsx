'use client';

import { useState } from 'react';
import { Hand } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AvatarStage } from '@/components/AvatarStage';
import { useT } from '@/lib/i18n/use-translation';

export default function AvatarPage() {
  const t = useT();
  const [draft, setDraft] = useState('HELLO');
  const [text, setText] = useState('HELLO');

  function signIt(e: React.FormEvent) {
    e.preventDefault();
    setText(draft);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('avatar.title')} context={t('avatar.context')} />

      <form onSubmit={signIt} className="card mb-6 flex flex-wrap items-end gap-3 p-6">
        <div className="flex-1">
          <label htmlFor="avatar-text" className="block text-sm font-medium text-ink">
            {t('avatar.textToFingerspell')}
          </label>
          <input
            id="avatar-text"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal"
            placeholder={t('avatar.inputPlaceholder')}
          />
        </div>
        <button type="submit" className="btn-primary gap-2 px-6 py-3">
          <Hand aria-hidden="true" className="h-5 w-5" />
          {t('avatar.signIt')}
        </button>
      </form>

      <AvatarStage text={text} autoPlay />
    </div>
  );
}
