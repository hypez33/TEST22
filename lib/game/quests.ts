import { Quest } from './types';

export const QUESTS: Quest[] = [
  {
    id: 'tutorial_harvest',
    icon: '🌱',
    title: 'Erste Ernte',
    description: 'Bringe deine erste Pflanze zur Ernte.',
    tasks: [{ type: 'harvest', amount: 1 }],
    rewards: [{ cash: 120, xp: 25 }]
  },
  {
    id: 'market_rookie',
    icon: '🛒',
    title: 'Markteinsteiger',
    description: 'Verkaufe 50g am Markt.',
    requirements: { minLevel: 1, prevQuestId: 'tutorial_harvest' },
    tasks: [{ type: 'sell', amount: 50 }],
    rewards: [{ cash: 200, xp: 30 }]
  },
  {
    id: 'gelato_run',
    icon: '🍨',
    title: 'Gelato Run',
    description: 'Ernte drei Portionen Green Gelato.',
    requirements: { minLevel: 2, prevQuestId: 'market_rookie' },
    tasks: [{ type: 'harvest', target: 'gelato', amount: 3 }],
    rewards: [{ seed: 'gelato', count: 2 }, { cash: 250, xp: 40 }]
  },
  {
    id: 'cash_stack',
    icon: '💰',
    title: 'Cash-Stack',
    description: 'Verdiene 1.000$ durch Verkäufe.',
    requirements: { minLevel: 3, prevQuestId: 'gelato_run' },
    tasks: [{ type: 'cash', amount: 1000 }],
    rewards: [{ cash: 400, item: 'scale', count: 1 }]
  },
  {
    id: 'pro_grower',
    icon: '🔥',
    title: 'Pro-Grower',
    description: 'Erreiche Level 5.',
    requirements: { minLevel: 1 },
    tasks: [{ type: 'level', amount: 5 }],
    rewards: [{ consumable: 'coffee_premium', count: 2 }, { xp: 80 }]
  }
];
