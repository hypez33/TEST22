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
  },
  {
    id: 'perfect_10',
    icon: '⭐',
    title: 'Erste Perfektion',
    description: 'Erreiche 10x Perfekt bei Minigames',
    reward: { type: 'haze', amount: 1 },
    condition: (s) => (s.perfectHarvests || 0) >= 10
  },
  {
    id: 'perfect_100',
    icon: '🏆',
    title: 'Meister-Grower',
    description: 'Erreiche 100x Perfekt bei Minigames',
    reward: { type: 'haze', amount: 3 },
    condition: (s) => (s.perfectHarvests || 0) >= 100
  },
  {
    id: 'perfect_streak',
    icon: '🔥',
    title: 'Im Flow',
    description: 'Erreiche 5x Perfekt hintereinander',
    reward: { type: 'haze', amount: 2 },
    condition: (s) => (s.perfectStreak || 0) >= 5
  }
];
