import { GameState } from './types';

export type AchievementReward = { type: 'haze'; amount: number };

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  reward: AchievementReward;
  condition: (state: GameState) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'harvest_10k',
    icon: '🌿',
    title: 'Ernte 10kg',
    description: 'Sammle insgesamt 10.000g',
    reward: { type: 'haze', amount: 1 },
    condition: (s) => (s.totalEarned || 0) >= 10_000
  },
  {
    id: 'cash_million',
    icon: '💰',
    title: 'Millionär',
    description: 'Besitze 1.000.000 $ Cash',
    reward: { type: 'haze', amount: 2 },
    condition: (s) => (s.cash || 0) >= 1_000_000
  },
  {
    id: 'slots_max',
    icon: '🏗️',
    title: 'Ausgebaut',
    description: 'Alle Grow-Slots freigeschaltet',
    reward: { type: 'haze', amount: 1 },
    condition: (s) => (s.slotsUnlocked || 0) >= 100
  }
];
