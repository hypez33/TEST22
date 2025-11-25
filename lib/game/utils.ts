import { CaseStats } from './types';

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const fmtNumber = (n: number) => {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1e6) {
    const m = (n / 1e6).toFixed(2);
    return `${parseFloat(m)}m`;
  }
  const opts: Intl.NumberFormatOptions = {
    minimumFractionDigits: Math.abs(n) < 1000 ? 2 : 0,
    maximumFractionDigits: Math.abs(n) < 1000 ? 2 : 0
  };
  return Number(n).toLocaleString('de-DE', opts);
};

export const formatMoney = (amount: number) => {
  const value = Number(amount) || 0;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}${fmtNumber(abs)}`;
};

export const formatTimer = (sec: number) => {
  if (!Number.isFinite(sec)) return '--:--';
  if (sec <= 0) return 'bereit';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const formatPercent = (delta: number) => {
  if (!Number.isFinite(delta)) return '0%';
  const pct = delta * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}%`;
};

export const defaultCaseStats = (): CaseStats => ({
  opened: 0,
  fastOpened: 0,
  bestDrop: '',
  bestRarity: '',
  bestEmoji: '',
  lastDrop: '',
  lastRarity: '',
  lastEmoji: ''
});
