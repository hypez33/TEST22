import { Quest } from './types';

export const QUESTS: Quest[] = [
  {
    id: 'starter_harvest',
    title: 'Erste Ernte',
    description: 'Ernte deine erste Pflanze.',
    tasks: [{ type: 'harvest', required: 1 }],
    rewards: [{ type: 'cash', value: 120 }, { type: 'xp', value: 25 }]
  },
  {
    id: 'market_rookie',
    title: 'Markteinsteiger',
    description: 'Verkaufe dein Produkt auf dem Markt.',
    tasks: [{ type: 'sell', required: 50 }],
    rewards: [{ type: 'cash', value: 200 }, { type: 'xp', value: 30 }]
  },
  {
    id: 'gelato_run',
    title: 'Gelato Run',
    description: 'Ernte drei Portionen Green Gelato.',
    requirements: { minLevel: 2 },
    tasks: [{ type: 'harvest', target: 'gelato', required: 3 }],
    rewards: [{ type: 'seed', id: 'gelato', count: 2 }, { type: 'cash', value: 250 }]
  },
  {
    id: 'cash_stack',
    title: 'Cash-Stack',
    description: 'Verdiene 1.000$ durch Verkäufe.',
    requirements: { minLevel: 3 },
    tasks: [{ type: 'cash', required: 1000 }],
    rewards: [{ type: 'cash', value: 400 }, { type: 'item', id: 'scale', count: 1 }]
  },
  {
    id: 'pro_grower',
    title: 'Pro-Grower',
    description: 'Erreiche Level 5.',
    requirements: { minLevel: 1 },
    tasks: [{ type: 'level', required: 5 }],
    rewards: [{ type: 'consumable', id: 'coffee_premium', count: 2 }, { type: 'xp', value: 50 }]
  }
];
