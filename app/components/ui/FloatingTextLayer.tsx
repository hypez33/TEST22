'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type FloatEvent = { text: string; x: number; y: number; tone?: 'gain' | 'loss' | 'info' | 'crit' };

let listeners: ((e: FloatEvent) => void)[] = [];

export const emitFloatingText = (text: string, x: number, y: number, tone: FloatEvent['tone'] = 'gain') => {
  listeners.forEach((l) => l({ text, x, y, tone }));
};

type FloatEntry = FloatEvent & { id: string; dx: number; dy: number };

export function FloatingTextLayer() {
  const [items, setItems] = useState<FloatEntry[]>([]);

  useEffect(() => {
    const handler = (e: FloatEvent) => {
      const id = Math.random().toString(36).slice(2, 9);
      const entry: FloatEntry = {
        id,
        ...e,
        dx: (Math.random() - 0.5) * 80,
        dy: -80 - Math.random() * 40
      };
      setItems((prev) => [...prev, entry]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, 1400);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  return (
    <div className="floating-layer" aria-hidden="true">
      <AnimatePresence>
        {items.map((i) => (
          <motion.span
            key={i.id}
            className={`floating-text active ${i.tone || 'gain'}`}
            initial={{ x: i.x, y: i.y, opacity: 0, scale: i.tone === 'crit' ? 1.3 : 1 }}
            animate={{
              x: [i.x, i.x + i.dx * 0.6, i.x + i.dx],
              y: [i.y, i.y + i.dy * 0.5, i.y + i.dy],
              opacity: [0, 1, 0],
              scale: i.tone === 'crit' ? [1.1, 1.35, 1.0] : [1, 1.05, 0.95]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {i.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
