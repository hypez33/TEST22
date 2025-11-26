'use client';

import { useEffect, useState } from 'react';

type Toast = {
  id: string;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
};

type Listener = (toast: Toast) => void;

const listeners = new Set<Listener>();

export const pushToast = (toast: Omit<Toast, 'id'>) => {
  const payload: Toast = { id: Math.random().toString(36).slice(2, 9), type: 'info', ...toast };
  listeners.forEach((fn) => fn(payload));
};

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler: Listener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3200);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <div className="toast-title">{t.title}</div>
          {t.message && <div className="toast-msg">{t.message}</div>}
        </div>
      ))}
    </div>
  );
}
