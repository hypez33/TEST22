'use client';

import { useEffect, useState } from 'react';

type FloatEvent = { text: string; x: number; y: number; tone?: 'gain' | 'loss' | 'info' };

let listeners: ((e: FloatEvent) => void)[] = [];

export const emitFloatingText = (text: string, x: number, y: number, tone: FloatEvent['tone'] = 'gain') => {
  listeners.forEach((l) => l({ text, x, y, tone }));
};

type FloatEntry = FloatEvent & { id: string };

export function FloatingTextLayer() {
  const [items, setItems] = useState<FloatEntry[]>([]);

  useEffect(() => {
    const handler = (e: FloatEvent) => {
      const id = Math.random().toString(36).slice(2, 9);
      const entry: FloatEntry = { id, ...e };
      setItems((prev) => [...prev, entry]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, 1100);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  return (
    <div className="floating-layer" aria-hidden="true">
      {items.map((i) => (
        <span
          key={i.id}
          className={`floating-text active ${i.tone || 'gain'}`}
          style={{ left: i.x, top: i.y }}
        >
          {i.text}
        </span>
      ))}
    </div>
  );
}
