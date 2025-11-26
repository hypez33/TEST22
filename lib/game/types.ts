export type Difficulty = 'easy' | 'normal' | 'hard';
export type Theme = 'dark' | 'light';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Strain {
  id: string;
  name: string;
  tag: string;
  rarity: Rarity;
  cost: number;
  yield: number;
  grow: number;
  quality: number;
  yieldBonus?: number;
  offerBonus?: number;
  desc?: string;
  base?: string;
  stages?: string[];
  generation?: number;
  traits?: StrainTrait[];
  stability?: number;
  lineage?: { p1: string; p2: string };
}

export type TraitType = 'yield' | 'growth' | 'water' | 'pest' | 'quality' | 'price' | 'nutrient';
export interface StrainTrait {
  id: string;
  name: string;
  type: TraitType;
  value: number;
  desc: string;
  isNegative?: boolean;
}

export interface PlantPest {
  id: string;
  sev?: number;
}

export interface Plant {
  slot: number;
  strainId: string;
  level: number;
  growProg: number;
  water: number;
  nutrients: number;
  health: number;
  quality: number;
  readyTime: number;
  pest?: PlantPest | null;
  pgrBoostSec?: number;
}

export type BatchStage = 'wet' | 'dry' | 'cured' | 'drying';

export interface ProcessedBatch {
  id: string;
  strainId?: string;
  grams: number;
  quality: number;
  stage: BatchStage;
  createdAt?: number;
}

export interface DryingJob {
  id: string;
  strainId?: string;
  wetGrams: number;
  quality: number;
  remaining: number;
  total: number;
  startedAt?: number;
}

export interface CuringJob {
  id: string;
  strainId?: string;
  grams: number;
  quality: number;
  startQuality?: number;
  targetQuality: number;
  remaining: number;
  total: number;
  startedAt?: number;
}

export interface ProcessingState {
  wet: ProcessedBatch[];
  drying: DryingJob[];
  curing: CuringJob[];
  ready: ProcessedBatch[];
  slots: { drying: number; curing: number };
}

export interface Consumables {
  water: number;
  nutrient: number;
  spray: number;
  fungicide: number;
  beneficials: number;
  pgr?: number;
  coffee?: number;
}

export interface GlobalUpgrade {
  id: string;
  name: string;
  baseCost: number;
  inc: number;
  desc: string;
}

export interface ItemEffects {
  priceMult?: number;
  offerSlot?: number;
  spawnDelta?: number;
  yieldMult?: number;
  pestReduce?: Record<string, number>;
  growthMult?: number;
  waterReduce?: number;
  nutrientBoost?: number;
  qualityMult?: number;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
  category: string;
  effects?: ItemEffects;
  stack?: boolean;
  rarity?: Rarity;
}

export interface Pest {
  id: string;
  name: string;
  icon: string;
  base: number;
  effect: { growth?: number; health?: number; quality?: number };
  prefers?: 'dry' | 'wet' | 'any' | 'wetroot' | 'overfeed';
}

export interface ResearchNode {
  name: string;
  desc: string;
  cost: number;
  effects?: Record<string, number | boolean>;
  requires: string[];
  position: { x: number; y: number };
}

export interface ResearchBranch {
  name: string;
  icon: string;
  nodes: Record<string, ResearchNode>;
}

export interface GrowRoom {
  id: string;
  name: string;
  slots: number;
  cost: number;
  exhaust: boolean;
  moldRisk: number;
  desc: string;
}

export interface Employee {
  id: string;
  name: string;
  desc: string;
  salary: number;
  tasks: string[];
  capacity?: number;
  reqLevel: number;
  image: string;
}

export interface PharmacyContract {
  id: string;
  name: string;
  desc: string;
  monthlyGrams: number;
  monthlyCash: number;
  costToHire: number;
  reqLevel: number;
}

export interface ConsumablePack {
  id: string;
  name: string;
  icon: string;
  price: number;
  desc: string;
  add: Partial<Consumables>;
}

export interface Job {
  id: string;
  name: string;
  salary: number;
  base: number;
  reqLevel: number;
  desc: string;
}

export interface CaseLoot {
  strainId: string;
  rarity: Rarity;
  weight: number;
}

export interface CaseConfig {
  id: string;
  name: string;
  price: number;
  description: string;
  lootBuilder: () => CaseLoot[];
  loot?: CaseLoot[];
}

export interface Offer extends Record<string, any> {
  id: string;
  qty?: number;
  price?: number;
  timer?: number;
  strainId?: string;
  rarity?: Rarity;
}

export interface Order extends Record<string, any> {
  id: string;
  qty?: number;
  reward?: number;
  timer?: number;
  strainId?: string;
  grams?: number;
  pricePerG?: number;
  expiresAt?: number;
}

export interface Application extends Record<string, any> {
  jobId?: string;
  chance?: number;
  decideAt?: number;
}

export interface GameMessage {
  id: number;
  text: string;
  type?: string;
  unread?: boolean;
  createdAt?: number;
}

export interface QuestTask {
  type: 'harvest' | 'sell' | 'cash' | 'level';
  target?: string;
  amount: number;
  current?: number;
}

export interface QuestRequirement {
  minLevel?: number;
  prevQuestId?: string;
}

export interface QuestReward {
  xp?: number;
  cash?: number;
  item?: string;
  seed?: string;
  consumable?: string;
  count?: number;
  message?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon?: string;
  requirements?: QuestRequirement;
  tasks: QuestTask[];
  rewards: QuestReward[];
}

export interface QuestProgress {
  id: string;
  tasks: QuestTask[];
  status: 'active' | 'ready' | 'claimed';
}

export interface CartEntry {
  id: string;
  qty: number;
  price?: number;
  name?: string;
  kind: 'seed' | 'item' | 'consumable';
}

export interface CaseStats {
  opened: number;
  fastOpened: number;
  bestDrop: string;
  bestRarity: string;
  bestEmoji: string;
  lastDrop: string;
  lastRarity: string;
  lastEmoji: string;
}

export interface GameState {
  saveVersion?: number;
  grams: number;
  concentrates?: number;
  priceHistory?: number[];
  totalEarned: number;
  bestPerSec: number;
  hazePoints: number;
  resets: number;
  playtimeSec: number;
  harvestBonus?: number;
  growthBonus?: number;
  timeSpeed: number;
  gameDaysTotal: number;
  lastYearProcessed: number;
  lastTime: number;
  growTierIndex: number;
  slotsUnlocked: number;
  plants: Plant[];
  purchasedCount: Record<string, number>;
  upgrades: Record<string, number>;
  theme: Theme;
  highContrast: boolean;
  compactMode: boolean;
  cash: number;
  level: number;
  xp: number;
  totalCashEarned: number;
  tradesDone: number;
  offers: Offer[];
  nextOfferIn: number;
  itemsOwned: Record<string, number>;
  seeds: Record<string, number>;
  cart: CartEntry[];
  consumables: Consumables;
  processing: ProcessingState;
  difficulty: Difficulty;
  marketMult: number;
  marketTrend?: 'up' | 'down' | 'stable';
  nextMarketShiftIn?: number;
  marketTrendMult?: number;
  marketTrendName?: string;
  marketNews?: string;
  marketNewsTimer?: number;
  marketNewsMult?: number;
  eventWaterMult?: number;
  marketTimer: number;
  marketEventName: string;
  marketEventCooldown?: number;
  research: Record<string, boolean>;
  reputation: number;
  orders: Order[];
  nextOrderIn: number;
  nextGameEventIn?: number;
  nextApothekenOfferIn?: number;
  qualityPool: { grams: number; weighted: number };
  jobId: string | null;
  applications: Application[];
  messages: GameMessage[];
  nextMsgId: number;
  unreadMessages: number;
  maintenance: { filterPenaltyActive: boolean; filterNextDueAtDays: number };
  lastMonthProcessed: number;
  nextMarketEventIn: number;
  welcomeRewarded: boolean;
  sidebarCollapsed: boolean;
  customStrains: Strain[];
  discoveredStrains?: string[];
  employees: Record<string, EmployeeState>;
  apothekenVertraege: Record<string, boolean>;
  apothekenOffers?: Array<any>;
  activeEvents: any[];
  cashRain?: boolean;
  pestGlobalRate?: number;
  caseInventory: Record<string, number>;
  caseStats: CaseStats;
  inventoryFilter: string;
  inventorySort: string;
  questStep?: number;
  quests: QuestProgress[];
  activeQuests: string[];
  completedQuests: string[];
  unlockedAchievements?: string[];
  soundFx?: boolean;
  breedingSlots?: { parent1: string | null; parent2: string | null };
  lastBreedingResult?: Strain | null;
  favorites?: string[];
  bulkConserve?: boolean;
  staffEnergy?: Record<string, EmployeeState>;
  strainMastery?: Record<string, number>;
  autoGrow?: Record<string, boolean>;
  settings?: {
    miniGamesEnabled?: boolean;
    autoSkipMiniGame?: boolean;
    miniGameDifficulty?: 'easy' | 'normal' | 'hard';
  };
  perfectHarvests?: number;
  perfectStreak?: number;
  _empTimer?: number;
  _achTimer?: number;
}

export interface EmployeeState {
  hired: boolean;
  level: number;
  energy: number;
  resting?: boolean;
}
