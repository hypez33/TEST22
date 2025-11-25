'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ParticleKind = 'leaf' | 'coin';
type ParticleEvent = { x: number; y: number; kind?: ParticleKind; count?: number; target?: { x: number; y: number } };
type Particle = {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  kind: ParticleKind;
  target?: { x: number; y: number };
};

let particleListeners: ((p: ParticleEvent) => void)[] = [];

export const emitClickParticles = (event: ParticleEvent) => {
  particleListeners.forEach((l) => l(event));
};

export function ClickEffects() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handler = (evt: ParticleEvent) => {
      const count = Math.max(4, evt.count || 10);
      const next: Particle[] = [];
      for (let i = 0; i < count; i++) {
        next.push({
          id: Math.random().toString(36).slice(2, 9) + i,
          x: evt.x,
          y: evt.y,
          dx: (Math.random() - 0.5) * 80,
          dy: -40 - Math.random() * 40,
          kind: evt.kind || 'leaf',
          target: evt.target
        });
      }
      setParticles((prev) => [...prev, ...next]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !next.find((n) => n.id === p.id)));
      }, 1200);
    };
    particleListeners.push(handler);
    return () => {
      particleListeners = particleListeners.filter((l) => l !== handler);
    };
  }, []);

  return (
    <div className="floating-layer click-effects" aria-hidden="true">
      <AnimatePresence>
        {particles.map((p) => {
          const endX = p.target ? p.target.x : p.x + p.dx;
          const endY = p.target ? p.target.y : p.y + 120 + Math.random() * 60;
          return (
            <motion.div
              key={p.id}
              initial={{ x: p.x, y: p.y, scale: 0.8, opacity: 0.95, rotate: 0 }}
              animate={{ x: endX, y: endY, scale: 0.6, opacity: 0, rotate: Math.random() * 120 - 60 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`particle particle-${p.kind}`}
            >
              {p.kind === 'coin' ? '🪙' : '🌿'}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
