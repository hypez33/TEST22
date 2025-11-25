import { z } from 'zod';

export const consumablesSchema = z.object({
  water: z.number().optional(),
  nutrient: z.number().optional(),
  spray: z.number().optional(),
  fungicide: z.number().optional(),
  beneficials: z.number().optional(),
  pgr: z.number().optional(),
  coffee: z.number().optional()
});

export const processingSchema = z.object({
  wet: z.array(z.any()).optional(),
  drying: z.array(z.any()).optional(),
  curing: z.array(z.any()).optional(),
  ready: z.array(z.any()).optional(),
  slots: z.object({ drying: z.number().optional(), curing: z.number().optional() }).optional()
});

export const questSchema = z.object({
  id: z.string(),
  tasks: z.array(z.object({ type: z.string(), target: z.string().optional(), amount: z.number().optional(), current: z.number().optional() })),
  status: z.enum(['active', 'ready', 'claimed']).optional()
});

export const gameStateSchema = z.object({
  saveVersion: z.number().optional(),
  grams: z.number().optional(),
  concentrates: z.number().optional(),
  totalEarned: z.number().optional(),
  cash: z.number().optional(),
  level: z.number().optional(),
  xp: z.number().optional(),
  plants: z.array(z.any()).optional(),
  consumables: consumablesSchema.optional(),
  processing: processingSchema.optional(),
  quests: z.array(questSchema).optional(),
  completedQuests: z.array(z.string()).optional(),
  activeQuests: z.array(z.string()).optional(),
  unlockedAchievements: z.array(z.string()).optional(),
  settings: z
    .object({
      miniGamesEnabled: z.boolean().optional(),
      autoSkipMiniGame: z.boolean().optional(),
      miniGameDifficulty: z.enum(['easy', 'normal', 'hard']).optional()
    })
    .optional(),
  perfectHarvests: z.number().optional(),
  perfectStreak: z.number().optional(),
  favorites: z.array(z.string()).optional(),
  bulkConserve: z.boolean().optional(),
  itemsOwned: z.record(z.any()).optional(),
  seeds: z.record(z.number()).optional(),
  cart: z.array(z.any()).optional(),
  employees: z.record(z.any()).optional(),
  apothekenVertraege: z.record(z.boolean()).optional(),
  messages: z.array(z.any()).optional(),
  caseInventory: z.record(z.number()).optional(),
  caseStats: z.any().optional()
}).passthrough();
