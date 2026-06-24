'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { getPose, loadPoseLibrary, type PoseLibrary } from '@/lib/avatar/pose-library';

const HandAvatar = dynamic(() => import('@/lib/avatar/HandAvatar').then((m) => m.HandAvatar), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">Loading…</div>
  ),
});

/**
 * Shows a single sign's pose on the 3D hand (Phase 8). Degrades gracefully when
 * the pose library hasn't been generated, or no pose exists for the label.
 */
export function SignPoseView({ label }: { label: string }) {
  const [library, setLibrary] = useState<PoseLibrary | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void loadPoseLibrary().then((lib) => {
      if (!cancelled) setLibrary(lib);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (library === undefined) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-line bg-canvas text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (library === null) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-line bg-canvas p-4 text-center text-sm text-muted">
        <AlertCircle aria-hidden="true" className="h-5 w-5 text-signalInk" />
        <span>Avatar poses not generated yet.</span>
        <Link href="/sign/collect" className="font-medium text-signalInk hover:underline">
          Set up signs →
        </Link>
      </div>
    );
  }

  const pose = getPose(library, label);
  if (!pose) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-line bg-canvas p-4 text-center text-sm text-muted">
        No pose recorded for “{label}”.
      </div>
    );
  }

  return (
    <div className="aspect-square w-full overflow-hidden rounded-xl border border-line bg-canvas">
      <HandAvatar pose={pose} />
    </div>
  );
}
