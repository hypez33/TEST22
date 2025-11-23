import { CaseStats } from './types';

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const fmtNumber = (n: number) => {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'k';
  return n.toFixed(2);
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
