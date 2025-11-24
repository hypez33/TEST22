'use client';

import { useMemo } from 'react';

export function useSound(src: string, enabled = true) {
  const audio = useMemo(() => {
    if (typeof Audio === 'undefined') return null;
    const a = new Audio(src);
    a.preload = 'auto';
    return a;
  }, [src]);

  const play = () => {
    if (!enabled || !audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  return { play };
}
