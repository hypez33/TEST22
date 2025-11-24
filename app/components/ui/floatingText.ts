'use client';

type Tone = 'gain' | 'loss' | 'info';

export const spawnFloatingText = (text: string, pos: { clientX: number; clientY: number }, tone: Tone = 'gain') => {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = `floating-text ${tone}`;
  el.textContent = text;
  el.style.left = `${pos.clientX}px`;
  el.style.top = `${pos.clientY}px`;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.add('active');
  });
  window.setTimeout(() => {
    el.remove();
  }, 1200);
};
