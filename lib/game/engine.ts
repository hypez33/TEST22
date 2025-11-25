import { isDraft, produce } from 'immer';
import {
  APOTHEKEN_VERTRAEGE,
  BASE_PRICE_PER_G,
  CASE_RARITIES,
  CONSUMABLE_PACKS,
  DAYS_PER_YEAR,
  DIFFICULTIES,
  EMPLOYEES,
  EXTRA_PESTS,
  GAME_DAY_REAL_SECONDS,
  GLOBAL_UPGRADES,
  GROW_ROOMS,
  HEALTH_DECAY_DRY,
  HEALTH_DECAY_HUNGRY,
  HEALTH_RECOVER_RATE,
  ITEMS,
  JOBS,
  OFFER_SPAWN_MAX,
  OFFER_SPAWN_MIN,
  MAX_ACTIVE_OFFERS_BASE,
  MAX_SLOTS,
  NUTRIENT_ADD_AMOUNT,
  NUTRIENT_DRAIN_PER_SEC,
  NUTRIENT_MAX,
  NUTRIENT_START,
  PEST_GLOBAL_RATE,
  PESTS,
  PGR_BOOST_SEC,
  QUALITY_GAIN_GOOD,
  QUALITY_LOSS_BAD,
  READY_DECAY_DELAY,
  RESEARCH_TREE,
  SAVE_KEY,
  STAGE_LABELS,
  STRAINS,
  WATER_ADD_AMOUNT,
  WATER_DRAIN_PER_SEC,
  WATER_MAX,
  WATER_START,
  buildCaseConfigs
} from './data';
import { CaseStats, CartEntry, GameState, Plant, ProcessedBatch, ProcessingState, QuestProgress, Rarity, Strain } from './types';
import { QUESTS } from './quests';
import { ACHIEVEMENTS } from './achievements';
import { clamp, defaultCaseStats, fmtNumber } from './utils';

export const SPEED_OPTIONS = [0, 0.5, 1, 2, 7];
const SAVE_VERSION = 2;
const DRYING_TIME_SEC = 240;
const CURING_TIME_SEC = 300;
const DRY_WEIGHT_MULT = 0.3;
const DRY_PRICE_MULT = 1.5;
const CURING_QUALITY_BONUS = 0.25;
const CURING_QUALITY_CAP = 2.2;
const WATER_COST = 0.2;
const ROSIN_YIELD_MULT = 0.35;
const ROSIN_MIN_QUALITY = 1;
const uid = () => Math.random().toString(36).slice(2, 9);

export const createInitialState = (): GameState => ({
  saveVersion: SAVE_VERSION,
  grams: 0,
  concentrates: 0,
  priceHistory: [],
  totalEarned: 0,
  bestPerSec: 0,
  hazePoints: 0,
  resets: 0,
  playtimeSec: 0,
  harvestBonus: 1,
  growthBonus: 1,
  timeSpeed: 0,
  gameDaysTotal: 0,
  lastYearProcessed: 1,
  lastTime: Date.now(),
  growTierIndex: 0,
  slotsUnlocked: 2,
  plants: [],
  purchasedCount: {},
  upgrades: {},
  theme: 'dark',
  highContrast: false,
  compactMode: false,
  cash: 500000,
  level: 1,
  xp: 0,
  totalCashEarned: 0,
  tradesDone: 0,
  offers: [],
  nextOfferIn: 10,
  nextApothekenOfferIn: 30,
  itemsOwned: {},
  seeds: {},
  cart: [],
  consumables: { water: 0, nutrient: 0, spray: 0, fungicide: 0, beneficials: 0, pgr: 0, coffee: 0 },
  marketTrendMult: 1,
  marketTrendName: 'Stabil',
  marketNews: '',
  marketNewsTimer: 0,
  marketNewsMult: 1,
  eventWaterMult: 1,
  quests: [],
  activeQuests: [],
  completedQuests: [],
  unlockedAchievements: [],
  autoGrow: {},
  processing: { wet: [], drying: [], curing: [], ready: [], slots: { drying: 2, curing: 2 } },
  difficulty: 'normal',
  marketMult: 1,
  marketTrend: 'stable',
  nextMarketShiftIn: 90,
  marketTimer: 0,
  marketEventName: '',
  marketEventCooldown: 300,
  apothekenOffers: [],
  research: {},
  reputation: 0,
  orders: [],
  nextOrderIn: 60,
  nextGameEventIn: 300,
  qualityPool: { grams: 0, weighted: 0 },
  jobId: null,
  applications: [],
  messages: [],
  nextMsgId: 1,
  unreadMessages: 0,
  maintenance: { filterPenaltyActive: false, filterNextDueAtDays: 0 },
  lastMonthProcessed: 1,
  nextMarketEventIn: 90,
  welcomeRewarded: false,
  sidebarCollapsed: false,
  customStrains: [],
  employees: {},
  staffEnergy: {},
  apothekenVertraege: {},
  activeEvents: [],
  cashRain: false,
  pestGlobalRate: PEST_GLOBAL_RATE,
  caseInventory: {},
  caseStats: defaultCaseStats(),
  inventoryFilter: 'all',
  inventorySort: 'name',
  questStep: 0,
  favorites: [],
  bulkConserve: false,
  soundFx: true,
  strainMastery: {},
  breedingSlots: { parent1: null, parent2: null },
  _empTimer: 0,
  _achTimer: 0
});

const ensureConsumables = (state: any): GameState => {
  const normalize = (source?: Partial<GameState['consumables']>) => {
    const c = { water: 0, nutrient: 0, spray: 0, fungicide: 0, beneficials: 0, pgr: 0, coffee: 0, ...(source || {}) };
    return {
      water: Math.max(0, Math.floor(c.water || 0)),
      nutrient: Math.max(0, Math.floor(c.nutrient || 0)),
      spray: Math.max(0, Math.floor(c.spray || 0)),
      fungicide: Math.max(0, Math.floor(c.fungicide || 0)),
      beneficials: Math.max(0, Math.floor(c.beneficials || 0)),
      pgr: Math.max(0, Math.floor(c.pgr || 0)),
      coffee: Math.max(0, Math.floor(c.coffee || 0))
    };
  };
  if (isDraft(state)) {
    state.consumables = normalize(state.consumables);
    return state;
  }
  const next = { ...(state as GameState) };
  next.consumables = normalize(state.consumables);
  return next;
};

const MARKET_TRENDS = [
  { id: 'indica', name: 'Indica-Hype', mult: 1.2, desc: 'Indica gefragt. +20% Verkaufspreis' },
  { id: 'sativa', name: 'Sativa-Surge', mult: 1.15, desc: 'Sativa ist gefragt. +15% Preis' },
  { id: 'organic', name: 'Bio-Boom', mult: 1.1, desc: 'Bio-Käufer zahlen mehr.' },
  { id: 'glut', name: 'Markt-Glut', mult: 0.85, desc: 'Übersättigung. -15% Preis' },
  { id: 'stable', name: 'Stabil', mult: 1.0, desc: 'Normale Nachfrage.' }
];

const MARKET_NEWS = [
  { name: 'Polizei-Razzia in der Stadt! Preise steigen', mult: 1.2, duration: 300 },
  { name: 'Große Ernteflut! Preise sinken', mult: 0.85, duration: 240 },
  { name: 'Medizinischer Boom', mult: 1.15, duration: 360 }
];

const MARKET_EVENTS = [
  { type: 'heatwave', name: 'Hitzewelle', desc: 'Wasserverbrauch +50%', duration: 300 },
  { type: 'festival', name: 'Festival in der Stadt', desc: 'Preise +20%', duration: 600 }
];

const masteryLevel = (xp: number) => {
  if (xp >= 1000) return 10;
  if (xp >= 600) return 7;
  if (xp >= 300) return 5;
  if (xp >= 120) return 3;
  if (xp >= 60) return 2;
  if (xp >= 30) return 1;
  return 0;
};

const addMasteryXp = (state: GameState, strainId: string, xp: number) => {
  state.strainMastery = state.strainMastery || {};
  state.strainMastery[strainId] = (state.strainMastery[strainId] || 0) + xp;
};

const masteryForStrain = (state: GameState, strainId: string) => {
  const xp = (state.strainMastery || {})[strainId] || 0;
  return { xp, level: masteryLevel(xp) };
};

export const masteryLevelFor = masteryLevel;

const ensureProcessing = (state: any): ProcessingState => {
  const normalize = (source?: Partial<ProcessingState>): ProcessingState => {
    const slots = source?.slots || { drying: 2, curing: 2 };
    return {
      wet: Array.isArray(source?.wet) ? source!.wet : [],
      drying: Array.isArray(source?.drying) ? source!.drying : [],
      curing: Array.isArray(source?.curing) ? source!.curing : [],
      ready: Array.isArray(source?.ready) ? source!.ready : [],
      slots: { drying: Math.max(1, slots.drying || 2), curing: Math.max(1, slots.curing || 2) }
    };
  };
  if (isDraft(state)) {
    state.processing = normalize(state.processing);
    return state.processing;
  }
  const normalized = normalize((state as GameState).processing);
  return normalized;
};

const normalizeQuestProgress = (qp: Partial<QuestProgress>): QuestProgress => {
  const quest = QUESTS.find((q) => q.id === qp.id);
  const baseTasks = quest?.tasks || qp.tasks || [];
  const tasks = baseTasks.map((t, idx) => {
    const amt = typeof (t as any).required === 'number' ? (t as any).required : t.amount;
    const current = Math.max(0, Math.min(amt, (qp.tasks?.[idx]?.current as number) || 0));
    return { ...t, amount: amt, current };
  });
  const status: QuestProgress['status'] = qp.status === 'ready' || qp.status === 'claimed' ? qp.status : 'active';
  return { id: qp.id || quest?.id || 'unknown', tasks, status };
};

const ensureQuestState = (state: GameState) => {
  state.quests = Array.isArray(state.quests) ? state.quests.map((q) => normalizeQuestProgress(q)) : [];
  state.activeQuests = Array.isArray(state.activeQuests) ? state.activeQuests : [];
  state.completedQuests = Array.isArray(state.completedQuests) ? state.completedQuests : [];
  state.marketTrendMult = typeof state.marketTrendMult === 'number' ? state.marketTrendMult : 1;
  state.marketTrendName = state.marketTrendName || 'Stabil';
};

const migrateState = (draft: GameState) => {
  draft.saveVersion = SAVE_VERSION;
  if (!Array.isArray(draft.unlockedAchievements)) draft.unlockedAchievements = [];
  if (typeof draft.concentrates !== 'number') draft.concentrates = 0;
  if (!draft.marketTrendName) draft.marketTrendName = 'Stabil';
  if (typeof draft.marketTrendMult !== 'number') draft.marketTrendMult = 1;
  if (!Array.isArray(draft.priceHistory)) draft.priceHistory = [];
  if (typeof draft.marketNewsMult !== 'number') draft.marketNewsMult = 1;
  draft.soundFx = typeof draft.soundFx === 'boolean' ? draft.soundFx : true;
  draft.strainMastery = draft.strainMastery || {};
  draft.autoGrow = draft.autoGrow || {};
  draft._achTimer = draft._achTimer || 0;
};

export const getAllStrains = (state: GameState) => STRAINS.concat(state.customStrains || []);

export const getStrain = (state: GameState, id: string): Strain => {
  const custom = (state.customStrains || []).find((s) => s.id === id);
  if (custom) return custom;
  return STRAINS.find((s) => s.id === id) || STRAINS[0];
};

const strainRarityIndex = (strain?: Strain) => {
  if (!strain) return 0;
  const idx = CASE_RARITIES.indexOf((strain.rarity as Rarity) || 'common');
  return idx >= 0 ? idx : 0;
};

export const hydrateState = (loaded?: Partial<GameState>): GameState => {
  return produce(createInitialState(), (draft) => {
    if (loaded) Object.assign(draft, loaded);
    if (!draft.caseStats) draft.caseStats = defaultCaseStats();
    draft.plants = Array.isArray(loaded?.plants) ? loaded!.plants : [];
    draft.plants.forEach((p) => ensurePlantDefaults(p));
    ensureConsumables(draft);
    ensureProcessing(draft);
    draft.lastTime = typeof draft.lastTime === 'number' ? draft.lastTime : Date.now();
    draft.seeds = draft.seeds || {};
    draft.itemsOwned = draft.itemsOwned || {};
    draft.upgrades = draft.upgrades || {};
    draft.purchasedCount = draft.purchasedCount || {};
    draft.cart = draft.cart || [];
    draft.favorites = Array.isArray(draft.favorites) ? draft.favorites : [];
    draft.bulkConserve = !!draft.bulkConserve;
    draft.concentrates = typeof draft.concentrates === 'number' ? draft.concentrates : 0;
    ensureQuestState(draft as any);
    syncQuests(draft as any);
    migrateState(draft as any);
    draft.applications = Array.isArray(draft.applications) ? draft.applications : [];
    draft.applications = draft.applications.map((a: any) => ({
      ...a,
      decideAt: typeof a.decideAt === 'number' ? a.decideAt : (draft.gameDaysTotal || 0) + 3
    }));
    draft.research = draft.research || {};
    draft.qualityPool = draft.qualityPool || { grams: 0, weighted: 0 };
    draft.caseInventory = draft.caseInventory || {};
    draft.caseStats = { ...defaultCaseStats(), ...(loaded?.caseStats || {}) };
    draft.inventoryFilter = draft.inventoryFilter || 'all';
    draft.inventorySort = draft.inventorySort || 'name';
    draft.marketTrend = draft.marketTrend || 'stable';
    draft.nextMarketShiftIn = typeof draft.nextMarketShiftIn === 'number' ? draft.nextMarketShiftIn : 90;
    draft.nextOrderIn = typeof draft.nextOrderIn === 'number' ? draft.nextOrderIn : 60;
    draft.nextGameEventIn = typeof draft.nextGameEventIn === 'number' ? draft.nextGameEventIn : 300;
    draft.activeEvents = draft.activeEvents || [];
    draft.pestGlobalRate = typeof draft.pestGlobalRate === 'number' ? draft.pestGlobalRate : PEST_GLOBAL_RATE;
    draft.cashRain = !!draft.cashRain;
    draft.slotsUnlocked = Math.max(2, Math.min(draft.slotsUnlocked || 2, currentMaxSlots(draft as any)));
    if (draft.employees?.grower && !draft.employees?.growhelper) {
      draft.employees.growhelper = { ...(draft.employees as any).grower };
      delete (draft.employees as any).grower;
    }
    if (draft.employees) {
      Object.keys(draft.employees).forEach((key) => {
        const val = (draft.employees as any)[key];
        if (val && typeof val === 'object' && (val as any).hired) {
          (draft.employees as any)[key] = {
            hired: true,
            level: Math.max(1, Number((val as any).level) || 1),
            energy: Math.min(100, Math.max(0, Number((val as any).energy) || 100)),
            resting: !!(val as any).resting
          };
        } else {
          delete (draft.employees as any)[key];
        }
      });
    } else {
      draft.employees = {};
    }
  });
};

export const slotUnlockCost = (current: number) => Math.round(100 * Math.pow(1.75, Math.max(0, current - 1)));

export const currentGrowRoom = (state: GameState) => GROW_ROOMS[Math.max(0, Math.min(GROW_ROOMS.length - 1, state.growTierIndex || 0))];
export const currentMaxSlots = (state: GameState) => {
  const room = currentGrowRoom(state);
  return Math.min(MAX_SLOTS, room?.slots || 2);
};

const itemPriceMultiplier = (state: GameState) => {
  let mult = 1;
  for (const it of ITEMS) {
    const owned = state.itemsOwned[it.id] || 0;
    if (!owned || !it.effects?.priceMult) continue;
    mult *= Math.pow(it.effects.priceMult, owned);
  }
  const res = researchEffects(state);
  mult *= 1 + (res.priceMult || 0);
  return mult;
};

const itemYieldMultiplier = (state: GameState) => {
  let mult = 1;
  for (const it of ITEMS) {
    const owned = state.itemsOwned[it.id] || 0;
    if (!owned || !it.effects?.yieldMult) continue;
    mult *= Math.pow(it.effects.yieldMult, owned);
  }
  return mult;
};

const itemQualityMultiplier = (state: GameState) => {
  let mult = 1;
  for (const it of ITEMS) {
    const owned = state.itemsOwned[it.id] || 0;
    if (!owned || !it.effects?.qualityMult) continue;
    mult *= Math.pow(it.effects.qualityMult, owned);
  }
  return mult;
};

const globalMultiplier = (state: GameState) => {
  let mult = 1;
  for (const up of GLOBAL_UPGRADES) {
    const lvl = state.upgrades[up.id] || 0;
    if (lvl > 0) mult *= Math.pow(1 + up.inc, lvl);
  }
  mult *= itemYieldMultiplier(state);
  mult *= 1 + 0.05 * Math.sqrt(state.hazePoints || 0);
  return mult;
};

export const researchEffects = (state: GameState) => {
  const res = state.research || {};
  const eff: Record<string, number> = { yield: 0, growth: 0, quality: 0, pest: 0, water: 0, cost: 0, pest_mold: 0, growthTime: 0, priceMult: 0, nutrientCost: 0 };
  for (const branchKey in RESEARCH_TREE) {
    const branch = RESEARCH_TREE[branchKey];
    for (const nodeKey in branch.nodes) {
      if (res[nodeKey]) {
        const e = branch.nodes[nodeKey].effects || {};
        eff.yield += (e.yield as number) || 0;
        eff.growth += (e.growth as number) || 0;
        eff.quality += (e.quality as number) || 0;
        eff.pest += (e.pest as number) || 0;
        eff.water += (e.water as number) || 0;
        eff.cost += (e.cost as number) || 0;
        eff.pest_mold += (e.pest_mold as number) || 0;
        eff.growthTime += (e.growthTime as number) || 0;
        eff.priceMult += (e.priceMult as number) || 0;
        eff.nutrientCost += (e.nutrientCost as number) || 0;
      }
    }
  }
  return eff;
};

export const createPlant = (strainId: string, slot: number): Plant => ({
  slot,
  strainId,
  level: 1,
  growProg: 0,
  water: WATER_START,
  nutrients: NUTRIENT_START,
  health: 100,
  quality: 1,
  readyTime: 0,
  pest: null
});

export const ensurePlantDefaults = (plant: Plant): Plant => {
  const mutable = isDraft(plant) || !Object.isFrozen(plant);
  const target = mutable ? plant : { ...plant };
  target.level = typeof target.level === 'number' ? target.level : 1;
  target.growProg = clamp(typeof target.growProg === 'number' ? target.growProg : 0, 0, 1);
  target.water = clamp(typeof target.water === 'number' ? target.water : WATER_START, 0, WATER_MAX);
  target.nutrients = clamp(typeof target.nutrients === 'number' ? target.nutrients : NUTRIENT_START, 0, NUTRIENT_MAX);
  target.health = clamp(typeof target.health === 'number' ? target.health : 100, 0, 100);
  target.quality = clamp(typeof target.quality === 'number' ? target.quality : 1, 0.4, 1.5);
  target.readyTime = typeof target.readyTime === 'number' ? target.readyTime : 0;
  target.pest = target.pest || null;
  return target;
};

export const growTimeFor = (state: GameState, plant: Plant) => {
  const strain = getStrain(state, plant.strainId);
  if (strain.id === 'zushi') return 140;
  const base = strain.grow || 180;
  const res = researchEffects(state);
  const mod = 1 + (res.growthTime || 0);
  const mastery = masteryForStrain(state, plant.strainId);
  const masteryReduce = mastery.level >= 5 ? 0.9 : 1;
  return base * mod * masteryReduce;
};

const plantUpgradeCost = (state: GameState, plant: Plant) => {
  const strain = getStrain(state, plant.strainId);
  return Math.round(strain.cost * Math.pow(1.15, plant.level));
};

export const clampYield = (val: number, cap = 10000) => {
  if (!isFinite(val)) return 0;
  return Math.max(0, Math.min(val, cap));
};

export const harvestYieldDetails = (state: GameState, plant: Plant) => {
  const strain = getStrain(state, plant.strainId);
  const base = strain.yield || 10;
  if (plant.growProg < 0.62) return { value: 0, breakdown: { base, flowerBonus: 0, levelMult: 1, researchMult: 1, globalMult: 1, mastery: 1, timing: 1, event: state.harvestBonus || 1, cap: 0, appliedCap: false } };
  const flowerProgress = Math.max(0, (plant.growProg - 0.62) / 0.38);
  const flowerBonus = 0.3 + flowerProgress * 0.7;
  // flachere Skalierung mit abnehmenden Zugewinnen
  const levelMult = 1 + Math.log1p(Math.max(0, plant.level - 1)) * 0.35;
  const res = researchEffects(state);
  const bonus = state.harvestBonus || 1;
  const mastery = masteryForStrain(state, plant.strainId);
  const masteryYield = mastery.level >= 1 ? 1.05 : 1;
  const timingBonus = plant.readyTime <= 10 ? 1.15 : plant.readyTime > 60 ? 0.85 : 1;
  const rarityCaps: Record<string, number> = {
    common: 500,
    uncommon: 900,
    rare: 1500,
    epic: 2800,
    legendary: 5000
  };
  const cap = rarityCaps[(strain.rarity || 'common').toLowerCase()] || 800;
  const researchMult = 1 + (res.yield || 0);
  const globalMult = globalMultiplier(state);
  const raw = base * flowerBonus * levelMult * researchMult * globalMult * bonus * masteryYield * timingBonus;
  const value = clampYield(raw, cap);
  return {
    value,
    breakdown: {
      base,
      flowerBonus,
      levelMult,
      researchMult,
      globalMult,
      mastery: masteryYield,
      timing: timingBonus,
      event: bonus,
      cap,
      appliedCap: value < raw
    }
  };
};

export const harvestYieldFor = (state: GameState, plant: Plant) => harvestYieldDetails(state, plant).value;

const globalQualityPenalty = (state: GameState) => {
  if (state?.maintenance?.filterPenaltyActive) return 0.95;
  return 1 * itemQualityMultiplier(state);
};

export const qualityMultiplier = (state: GameState, plant: Plant) => {
  const q = clamp(plant.quality || 1, 0.4, 1.5);
  const healthFactor = clamp((plant.health || 100) / 100, 0.4, 1.1);
  const res = researchEffects(state);
  return q * (1 + (res.quality || 0)) * healthFactor * globalQualityPenalty(state);
};

export const timerForPlant = (state: GameState, plant: Plant) => {
  if (plant.growProg >= 1) return 0;
  return Math.max(0, growTimeFor(state, plant) * (1 - plant.growProg));
};

export const statusForPlant = (state: GameState, plant: Plant) => {
  const statuses: string[] = [];
  if (plant.growProg >= 1) {
    statuses.push('Erntebereit');
  } else {
    const idx = Math.min(STAGE_LABELS.length - 1, Math.floor(plant.growProg * STAGE_LABELS.length));
    statuses.push(STAGE_LABELS[idx]);
  }
  if (plant.water < 25) statuses.push('Durstig');
  else if (plant.water > 90) statuses.push('Zu nass');
  if (plant.nutrients < 25) statuses.push('Braucht Duenger');
  if (plant.health < 45) statuses.push('Stress');
  if (statuses.length === 0) statuses.push('Stabil');
  return statuses;
};

const getTimeSpeed = (state: GameState) => {
  const t = Number(state.timeSpeed);
  return SPEED_OPTIONS.includes(t) ? t : 0;
};

export const computePerSec = (state: GameState) => {
  const base = state.plants.reduce((sum, plant) => {
    const p = ensurePlantDefaults(plant);
    if (p.growProg >= 1 || p.health <= 0) return sum;
    const slow = p.water <= 0 || p.nutrients <= 0 ? 0.25 : 1;
    const d = DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal;
    const effTime = growTimeFor(state, p) / (d.growth || 1);
    const dryPer = harvestYieldFor(state, p) * qualityMultiplier(state, p) * DRY_WEIGHT_MULT;
    return sum + (dryPer / effTime) * slow;
  }, 0);
  return base * getTimeSpeed(state);
};

const pestDefById = (id: string) => {
  const p = PESTS.find((pest) => pest.id === id);
  if (p) return p;
  return EXTRA_PESTS[id];
};

const pestRiskModifiers = (state: GameState) => {
  const m: Record<string, number> = { mites: 1, mold: 1, thrips: 1 };
  const eff = researchEffects(state);
  const general = Math.max(0, 1 - (eff.pest || 0));
  m.mites *= general;
  m.mold *= general;
  m.thrips *= general;
  if (eff.pest_mold) m.mold *= Math.max(0, 1 - eff.pest_mold);
  const room = currentGrowRoom(state);
  if (room && room.moldRisk) m.mold *= room.moldRisk;
  for (const it of ITEMS) {
    const own = state.itemsOwned[it.id] || 0;
    if (!own || !it.effects?.pestReduce) continue;
    for (const key of Object.keys(it.effects.pestReduce)) {
      m[key] = (m[key] || 1) * Math.pow(it.effects.pestReduce[key]!, own);
    }
  }
  return m;
};

const maybeSpawnPestFor = (state: GameState, plant: Plant, dt: number, waterRatio: number, nutrientRatio: number) => {
  const d = DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal;
  const mods = pestRiskModifiers(state);
  const pestRate = state.pestGlobalRate || PEST_GLOBAL_RATE;
  const stagesIdx = Math.min(STAGE_LABELS.length - 1, Math.floor(plant.growProg * STAGE_LABELS.length));
  const inFlower = STAGE_LABELS[stagesIdx] === 'Bluete';
  for (const pest of PESTS) {
    let risk = pest.base * dt * (d.pest || 1) * (pestRate || 1);
    if ((pest.id === 'mold' || pest.id === 'mites') && !inFlower) continue;
    if (pest.prefers === 'dry' && waterRatio < 0.35) risk *= 3;
    if (pest.prefers === 'wet' && waterRatio > 0.85) risk *= 3.5;
    if (pest.prefers === 'wetroot') risk *= waterRatio > 0.9 ? 6 : 0.2;
    if (pest.prefers === 'overfeed') risk *= nutrientRatio > 0.9 ? 5 : 0.2;
    if (nutrientRatio < 0.25) risk *= 1.3;
    const doy = currentDayOfYear(state);
    if (isSummer(doy) && pest.id === 'mold') risk *= 1.8;
    if (mods[pest.id]) risk *= mods[pest.id];
    if (Math.random() < risk) {
      plant.pest = { id: pest.id, sev: 1 };
      return;
    }
  }
  if (!plant.pest) {
    let r1 = (EXTRA_PESTS.root_rot.base || 0.006) * dt * (pestRate || 1);
    r1 *= waterRatio > 0.9 ? 6 : 0.1;
    if (Math.random() < r1) {
      plant.pest = { id: 'root_rot', sev: 1 };
      return;
    }
    let r2 = (EXTRA_PESTS.leaf_rot.base || 0.008) * dt * (pestRate || 1);
    r2 *= nutrientRatio > 0.9 ? 5 : 0.1;
    if (Math.random() < r2) {
      plant.pest = { id: 'leaf_rot', sev: 1 };
    }
  }
};

const advancePlant = (state: GameState, plant: Plant, delta: number) => {
  ensurePlantDefaults(plant);
  let remaining = delta;
  const growTime = growTimeFor(state, plant);
  while (remaining > 0) {
    const step =
      remaining > 3600 ? 60 :
      remaining > 600 ? 20 :
      remaining > 120 ? 10 :
      remaining > 30 ? 5 :
      Math.min(remaining, 1);
    const res = researchEffects(state);
    const waterMult = state.eventWaterMult || 1;
    plant.water = clamp(plant.water - WATER_DRAIN_PER_SEC * waterMult * (1 - (res.water || 0)) * step, 0, WATER_MAX);
    plant.nutrients = clamp(plant.nutrients - NUTRIENT_DRAIN_PER_SEC * step, 0, NUTRIENT_MAX);

    const waterRatio = plant.water / WATER_MAX;
    const nutrientRatio = plant.nutrients / NUTRIENT_MAX;
    const goodWater = waterRatio >= 0.4 && waterRatio <= 0.85;
    const goodNutrient = nutrientRatio >= 0.4 && nutrientRatio <= 0.8;

    const d = DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal;
    let growthFactor = d.growth * (state.growthBonus || 1);
    let healthDelta = 0;
    let qualityDelta = 0;
    if (plant.pgrBoostSec && plant.pgrBoostSec > 0) {
      growthFactor *= 1.25;
      qualityDelta -= 0.002 * step;
      plant.pgrBoostSec = Math.max(0, plant.pgrBoostSec - step);
    }

    if (plant.water <= 0) {
      healthDelta -= HEALTH_DECAY_DRY * step;
      qualityDelta -= QUALITY_LOSS_BAD * step;
      growthFactor *= 0.05;
    } else if (waterRatio < 0.25) {
      healthDelta -= (HEALTH_DECAY_DRY / 2) * step;
      qualityDelta -= (QUALITY_LOSS_BAD / 2) * step;
      growthFactor *= 0.35;
    } else if (waterRatio > 0.9) {
      qualityDelta -= 0.02 * step;
      growthFactor *= 0.8;
    } else if (goodWater) {
      qualityDelta += QUALITY_GAIN_GOOD * step;
      healthDelta += HEALTH_RECOVER_RATE * 0.3 * step;
    }

    if (plant.nutrients <= 0) {
      healthDelta -= HEALTH_DECAY_HUNGRY * step;
      qualityDelta -= QUALITY_LOSS_BAD * step;
      growthFactor *= 0.25;
    } else if (nutrientRatio < 0.3) {
      healthDelta -= (HEALTH_DECAY_HUNGRY / 2) * step;
      qualityDelta -= (QUALITY_LOSS_BAD / 2) * step;
      growthFactor *= 0.5;
    } else if (nutrientRatio > 0.9) {
      qualityDelta -= 0.015 * step;
    } else if (goodNutrient) {
      qualityDelta += QUALITY_GAIN_GOOD * 0.8 * step;
    }

    if (plant.health < 40) growthFactor *= 0.6;

    const doy = currentDayOfYear(state);
    if (isWinter(doy) && !(state.upgrades?.['climate'] || 0)) {
      growthFactor *= 0.9;
    }

    if (!plant.pest) {
      maybeSpawnPestFor(state, plant, step, waterRatio, nutrientRatio);
    } else {
      const pestDef = pestDefById(plant.pest.id) || { effect: { growth: 0.8, health: -1, quality: -0.01 } };
      const sev = plant.pest.sev || 1;
      growthFactor *= Math.max(0.2, (pestDef.effect.growth || 1));
      healthDelta += (pestDef.effect.health || 0) * (0.5 + 0.5 * sev) * step;
      qualityDelta += (pestDef.effect.quality || 0) * (0.5 + 0.5 * sev) * step;
      plant.pest.sev = Math.min(3, sev + 0.04 * step);
    }
    if (plant.health > 85 && goodWater && goodNutrient) growthFactor *= 1.1;

    if (plant.growProg < 1) {
      plant.growProg = clamp(plant.growProg + (step / growTime) * growthFactor, 0, 1);
      if (plant.growProg >= 1) plant.readyTime = 0;
    } else {
      plant.readyTime = (plant.readyTime || 0) + step;
      if (plant.readyTime > READY_DECAY_DELAY) {
        qualityDelta -= (QUALITY_LOSS_BAD / 2) * step;
      }
    }

    if (goodWater && goodNutrient && plant.growProg < 1 && plant.health > 50) {
      healthDelta += HEALTH_RECOVER_RATE * step;
    }

    plant.health = clamp(plant.health + healthDelta, 0, 100);
    plant.quality = clamp(plant.quality + qualityDelta, 0.4, 1.5);

    if (plant.health <= 0) {
      plant.health = 0;
      plant.growProg = Math.min(plant.growProg, 0.1);
      break;
    }

    remaining -= step;
  }
};

const currentDayOfYear = (state: GameState) => {
  const total = Math.floor(state.gameDaysTotal || 0);
  return (total % DAYS_PER_YEAR) + 1;
};

const currentYear = (state: GameState) => {
  const total = Math.floor(state.gameDaysTotal || 0);
  return Math.floor(total / DAYS_PER_YEAR) + 1;
};

const monthFromDayOfYear = (doy: number) => {
  const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let d = doy;
  for (let m = 0; m < 12; m++) {
    if (d <= MONTH_DAYS[m]) return m + 1;
    d -= MONTH_DAYS[m];
  }
  return 12;
};

const isWinter = (doy: number) => doy >= 335 || doy <= 59;
const isSummer = (doy: number) => doy >= 152 && doy <= 243;

const computeMonthlyCost = (state: GameState) => {
  const base = 25;
  const perPlant = 5 * (state.plants?.length || 0);
  let total = base + perPlant;
  const eff = researchEffects(state);
  const mult = Math.max(0.3, 1 - (eff.cost || 0));
  total *= mult;
  return Math.round(total);
};

const computeEmployeeMonthlyCost = (state: GameState) => {
  let total = 0;
  for (const emp of EMPLOYEES) {
    if (state.employees[emp.id]) total += emp.salary;
  }
  return total;
};

const computeContractPayout = (state: GameState) => {
  let net = 0;
  let gramsNeeded = 0;
  for (const v of APOTHEKEN_VERTRAEGE) {
    if (state.apothekenVertraege[v.id]) {
      net += v.monthlyCash;
      gramsNeeded += v.monthlyGrams;
    }
  }
  return { net, gramsNeeded };
};

const saleQualityMultiplier = (avgQ: number) => {
  if (!isFinite(avgQ) || avgQ <= 0) return 1;
  if (avgQ >= 1.35) return 1.6;
  if (avgQ >= 1.15) return 1.25;
  return 1.0;
};

export const formatGameClock = (state: GameState) => {
  const total = state.gameDaysTotal || 0;
  const dayInt = Math.floor(total);
  const frac = total - dayInt;
  const hour = Math.floor(frac * 24);
  const minute = Math.floor((frac * 24 - hour) * 60);
  const year = Math.floor(dayInt / DAYS_PER_YEAR) + 1;
  const dayOfYear = (dayInt % DAYS_PER_YEAR) + 1;
  return `Jahr ${year}, Tag ${dayOfYear} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const researchAvailable = (state: GameState) => {
  const totalPoints = Math.floor((state.totalEarned || 0) / 500) + (state.hazePoints || 0);
  let spent = 0;
  for (const branchKey in RESEARCH_TREE) {
    const branch = RESEARCH_TREE[branchKey];
    for (const nodeKey in branch.nodes) {
      if (state.research?.[nodeKey]) spent += branch.nodes[nodeKey].cost;
    }
  }
  return Math.max(0, totalPoints - spent);
};

const canBuyResearch = (state: GameState, nodeId: string) => {
  for (const branchKey in RESEARCH_TREE) {
    const branch = RESEARCH_TREE[branchKey];
    if (branch.nodes[nodeId]) {
      const node = branch.nodes[nodeId];
      if (state.research?.[nodeId]) return false;
      const available = researchAvailable(state);
      if (available < node.cost) return false;
      if (node.requires?.length) {
        return node.requires.every((req) => state.research?.[req]);
      }
      return true;
    }
  }
  return false;
};

export const buyResearchNode = (state: GameState, nodeId: string) => {
  if (!canBuyResearch(state, nodeId)) return state;
  return produce(state, (draft) => {
    draft.research[nodeId] = true;
  });
};

const advanceGameTime = (state: GameState, dtWorld: number) => {
  const prevTotal = state.gameDaysTotal || 0;
  state.gameDaysTotal = (state.gameDaysTotal || 0) + dtWorld / GAME_DAY_REAL_SECONDS;
  const prevYear = Math.floor(Math.floor(prevTotal) / DAYS_PER_YEAR) + 1;
  const newYear = Math.floor(Math.floor(state.gameDaysTotal) / DAYS_PER_YEAR) + 1;
  if (newYear > (state.lastYearProcessed || 0)) {
    for (let y = Math.max(prevYear, (state.lastYearProcessed || 0) + 1); y <= newYear; y++) {
      const shears = state.itemsOwned?.['shears'] || 0;
      if (shears > 0) state.itemsOwned['shears'] = shears - 1;
    }
    state.lastYearProcessed = newYear;
  }

  if (!state.maintenance) state.maintenance = { filterPenaltyActive: false, filterNextDueAtDays: 0 } as any;
  if (!(state.maintenance.filterNextDueAtDays > 0)) {
    state.maintenance.filterNextDueAtDays = (state.gameDaysTotal || 0) + DAYS_PER_YEAR / 2;
  }
  if (!state.maintenance.filterPenaltyActive && (state.gameDaysTotal || 0) >= (state.maintenance.filterNextDueAtDays || 0)) {
    state.maintenance.filterPenaltyActive = true;
    state.maintenance.filterNextDueAtDays = 0;
  }

  const y = currentYear(state);
  const doy = currentDayOfYear(state);
  const curMonth = monthFromDayOfYear(doy);
  const currentIndex = (y - 1) * 12 + curMonth;
  let lastIdx = state.lastMonthProcessed || 1;
  if (currentIndex > lastIdx) {
    for (let idx = lastIdx + 1; idx <= currentIndex; idx++) {
      const cost = computeMonthlyCost(state);
      const empCost = computeEmployeeMonthlyCost(state);
      const contracts = computeContractPayout(state);
      state.cash -= cost + empCost;
      if (contracts.net > 0) {
        const gramsPay = Math.min(state.grams, contracts.gramsNeeded);
        state.grams -= gramsPay;
        state.cash += contracts.net;
      }
      if (state.jobId) {
        const job = JOBS.find((j) => j.id === state.jobId);
        if (job) state.cash += job.salary;
      }
    }
    state.lastMonthProcessed = currentIndex;
  }
};

const cleanExpiredOffers = (state: GameState) => {
  const now = Date.now();
  state.offers = (state.offers || []).filter((o) => o.expiresAt > now);
  state.apothekenOffers = (state.apothekenOffers || []).filter((o) => o.expiresAt > now);
  state.orders = (state.orders || []).filter((o: any) => o.expiresAt > now);
};

const currentMaxOffers = (state: GameState) => {
  const extra = state.itemsOwned['van'] || 0;
  return MAX_ACTIVE_OFFERS_BASE + extra;
};

const currentSpawnWindow = (state: GameState) => {
  const vanDelta = (state.itemsOwned['van'] || 0) * 10;
  const extraDelta = ITEMS.reduce((acc, it) => {
    const owned = state.itemsOwned[it.id] || 0;
    if (!owned || !it.effects?.spawnDelta) return acc;
    return acc + it.effects.spawnDelta * owned;
  }, 0);
  const delta = vanDelta + extraDelta;
  const min = Math.max(20, (OFFER_SPAWN_MIN || 45) - delta);
  const max = Math.max(min + 5, (OFFER_SPAWN_MAX || 90) - delta);
  return [min, max];
};

const spawnOffer = (state: GameState) => {
  const scale = Math.max(1, Math.sqrt(Math.max(1, state.totalEarned)) / 20);
  const grams = clamp(Math.floor(40 * scale + Math.random() * (400 * scale)), 20, 1000000);
  const priceMult = 1.1 + Math.random() * 0.9;
  const pricePerG = parseFloat((BASE_PRICE_PER_G * priceMult).toFixed(2));
  const ttl = 60 + Math.floor(Math.random() * 120);
  const id = String(Math.floor(Math.random() * 1e6));
  state.offers.push({ id, grams, pricePerG, expiresAt: Date.now() + ttl * 1000 });
};

const spawnApothekenOffer = (state: GameState) => {
  if (state.level < 4) return;
  const scale = Math.max(1, Math.sqrt(Math.max(1, state.totalEarned)) / 20);
  const grams = clamp(Math.floor(50 * scale + Math.random() * (300 * scale)), 30, 500000);
  const priceMult = 1.2 + Math.random() * 1.0;
  const pricePerG = parseFloat((BASE_PRICE_PER_G * priceMult).toFixed(2));
  const ttl = 90 + Math.floor(Math.random() * 180);
  const id = String(Math.floor(Math.random() * 1e6));
  state.apothekenOffers = state.apothekenOffers || [];
  state.apothekenOffers.push({ id, grams, pricePerG, expiresAt: Date.now() + ttl * 1000 });
};

const spawnOrder = (state: GameState) => {
  const strain = STRAINS[Math.floor(Math.random() * STRAINS.length)];
  const base = BASE_PRICE_PER_G * (state.marketMult || 1);
  const pricePerG = parseFloat((base * (1.2 + Math.random() * 0.6)).toFixed(2));
  const grams = Math.floor(50 + Math.random() * 250);
  const ttl = 120 + Math.floor(Math.random() * 240);
  const id = Math.floor(Math.random() * 1e6).toString();
  state.orders = state.orders || [];
  state.orders.push({ id, strainId: strain.id, grams, pricePerG, expiresAt: Date.now() + ttl * 1000 });
};

export const tickState = (state: GameState, realSeconds: number): GameState => {
  const speed = getTimeSpeed(state);
  const worldDt = Math.max(0, realSeconds * speed);
  let next = produce(state, (draft) => {
    draft.playtimeSec += Math.max(0, realSeconds);
    draft.lastTime = Date.now();
    syncQuests(draft as any);
    draft._achTimer = (draft._achTimer || 0) + realSeconds;
    if (worldDt <= 0) return;
    draft.plants.forEach((p) => advancePlant(draft as any, p, worldDt));
    advanceGameTime(draft as any, worldDt);
    advanceProcessing(draft as any, worldDt);
    // offers timers
    draft.nextOfferIn = Math.max(0, (draft.nextOfferIn || 0) - worldDt);
    draft.nextApothekenOfferIn = Math.max(0, (draft.nextApothekenOfferIn || 0) - worldDt);
    draft.nextOrderIn = Math.max(0, (draft.nextOrderIn || 0) - worldDt);
    if (draft.nextOfferIn === 0 && (draft.offers?.length || 0) < currentMaxOffers(draft as any)) {
      spawnOffer(draft as any);
      const [min, max] = currentSpawnWindow(draft as any);
      draft.nextOfferIn = min + Math.random() * (max - min);
    }
    if (draft.nextApothekenOfferIn === 0 && (draft.apothekenOffers?.length || 0) < currentMaxOffers(draft as any)) {
      spawnApothekenOffer(draft as any);
      draft.nextApothekenOfferIn = Math.max(30, Math.random() * 60 + 30);
    }
    if (draft.nextOrderIn === 0 && (draft.orders?.length || 0) < 3) {
      spawnOrder(draft as any);
      draft.nextOrderIn = 90 + Math.random() * 120;
    }
    cleanExpiredOffers(draft as any);
    processApplications(draft as any);
    // random game events
    draft.nextGameEventIn = typeof draft.nextGameEventIn === 'number' ? draft.nextGameEventIn : 300;
    draft.nextGameEventIn = Math.max(0, (draft.nextGameEventIn || 0) - worldDt);
    if (draft.nextGameEventIn === 0) {
      spawnRandomEvent(draft as any);
      draft.nextGameEventIn = 300 + Math.random() * 600;
    }
    draft.activeEvents = (draft.activeEvents || []).map((ev: any) => ({ ...ev, duration: Math.max(0, (ev.duration || 0) - worldDt) })).filter((ev: any) => ev.duration > 0);
    // reapply event effects
    draft.pestGlobalRate = PEST_GLOBAL_RATE;
    draft.harvestBonus = draft.harvestBonus || 1;
    draft.growthBonus = draft.growthBonus || 1;
    draft.cashRain = false;
    for (const ev of draft.activeEvents as any) {
      if (ev.type === 'pest_plague') draft.pestGlobalRate = (PEST_GLOBAL_RATE || 1) * 2;
      if (ev.type === 'harvest_blessing') draft.harvestBonus = 2;
      if (ev.type === 'growth_boost') draft.growthBonus = 1.5;
      if (ev.type === 'cash_rain') draft.cashRain = true;
    }
    if (draft.cashRain && Math.random() < 0.1 * worldDt) {
      const bonus = Math.floor(Math.random() * 50) + 10;
      draft.cash += bonus;
    }
    marketDrift(draft as any, worldDt);
    if (draft.marketTimer > 0) draft.marketTimer = Math.max(0, draft.marketTimer - worldDt);
    if (draft.nextMarketEventIn > 0) draft.nextMarketEventIn = Math.max(0, draft.nextMarketEventIn - worldDt);
    if (draft.nextMarketEventIn === 0 && draft.marketTimer === 0) spawnMarketEvent(draft as any);
    draft.marketNewsTimer = Math.max(0, (draft.marketNewsTimer || 0) - worldDt);
    if (draft.marketNewsTimer === 0 && Math.random() < 0.01 * worldDt) {
      const ev = MARKET_NEWS[Math.floor(Math.random() * MARKET_NEWS.length)];
      draft.marketNews = ev.name;
      draft.marketNewsMult = ev.mult;
      draft.marketNewsTimer = ev.duration;
      draft.marketMult *= ev.mult;
      pushMessage(draft as any, ev.name, 'info');
    }
    if (draft.marketNewsTimer === 0 && (draft.marketNewsMult !== 1 || draft.eventWaterMult !== 1)) {
      draft.marketMult = draft.marketMult / (draft.marketNewsMult || 1);
      draft.marketNewsMult = 1;
      draft.marketNews = '';
      draft.eventWaterMult = 1;
    }
    const perSec = computePerSec(draft as any);
    draft.bestPerSec = Math.max(draft.bestPerSec, perSec);
  });
  if (worldDt > 0) {
    next = employeeActions(next, worldDt);
  }
  if ((next._achTimer || 0) >= 5) {
    next = produce(next, (draft) => {
      draft._achTimer = 0;
      checkAchievements(draft as any);
      draft.marketEventCooldown = Math.max(0, (draft.marketEventCooldown || 0) - 5);
      if ((draft.marketEventCooldown || 0) <= 0) {
        if (Math.random() < 0.3 && (draft.marketNewsTimer || 0) === 0) {
          triggerMarketEvent(draft as any);
        }
        draft.marketEventCooldown = 300 + Math.random() * 300;
      }
    });
  }
  next = advanceQuest(next);
  return next;
};

export const applyOfflineProgress = (state: GameState) => {
  const now = Date.now();
  const elapsed = Math.max(0, (now - (state.lastTime || now)) / 1000);
  if (elapsed < 1) return state;
  return tickState(state, elapsed);
};

export const getSalePricePerGram = (state: GameState) => {
  const base = BASE_PRICE_PER_G * (state.marketMult || 1) * (state.marketNewsMult || 1);
  const mult = itemPriceMultiplier(state) * (state.marketTrendMult || 1);
  const avgQ = (state.qualityPool.grams || 0) > 0 ? state.qualityPool.weighted / state.qualityPool.grams : 1;
  const qMult = 1 + clamp(avgQ - 1, -0.6, 2);
  return base * mult * qMult;
};

export const calcPrestigeGain = (totalEarned: number) => Math.floor(Math.pow(totalEarned / 10000, 0.5));

export const sellGrams = (state: GameState, grams: number) => {
  grams = Math.max(0, grams);
  if (grams <= 0 || state.grams < grams) return state;
  const pricePerG = getSalePricePerGram(state);
  const cashGain = grams * pricePerG;
  const next = produce(state, (draft) => {
    draft.grams -= grams;
    draft.cash += cashGain;
    draft.totalCashEarned += cashGain;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
  });
  return checkQuestProgress(checkQuestProgress(next, 'sell', { amount: grams }), 'cash', { amount: cashGain });
};

export const sellToBuyer = (state: GameState, grams: number, buyer: 'street' | 'market' | 'dispensary') => {
  grams = Math.max(0, grams);
  if (grams <= 0 || state.grams < grams) return state;
  let mult = 1;
  if (buyer === 'street') mult = 0.85;
  if (buyer === 'dispensary') mult = 1.15;
  const pricePerG = getSalePricePerGram(state) * mult;
  const cashGain = grams * pricePerG;
  const next = produce(state, (draft) => {
    draft.grams -= grams;
    draft.cash += cashGain;
    draft.totalCashEarned += cashGain;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
  });
  return checkQuestProgress(checkQuestProgress(next, 'sell', { amount: grams }), 'cash', { amount: cashGain });
};

export const acceptOffer = (state: GameState, id: number | string) => {
  const idx = state.offers.findIndex((o: any) => String(o.id) === String(id));
  if (idx === -1) return state;
  const offer: any = state.offers[idx];
  if (offer.expiresAt <= Date.now()) {
    return produce(state, (draft) => {
      draft.offers = draft.offers.filter((o: any) => String(o.id) !== String(id));
    });
  }
  if (state.grams < offer.grams) return state;
  let totalCash = 0;
  const next = produce(state, (draft) => {
    const avgQ = (draft.qualityPool.grams || 0) > 0 ? draft.qualityPool.weighted / draft.qualityPool.grams : 1;
    const qMult = saleQualityMultiplier(avgQ);
    const total = offer.grams * offer.pricePerG * qMult;
    totalCash = total;
    draft.grams -= offer.grams;
    const usedWeighted = Math.min(draft.qualityPool.weighted || 0, avgQ * offer.grams);
    draft.qualityPool.grams = Math.max(0, (draft.qualityPool.grams || 0) - offer.grams);
    draft.qualityPool.weighted = Math.max(0, (draft.qualityPool.weighted || 0) - usedWeighted);
    draft.cash += total;
    draft.totalCashEarned += total;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
    draft.offers = draft.offers.filter((o: any) => String(o.id) !== String(id));
    addXP(draft as any, 10);
  });
  return checkQuestProgress(checkQuestProgress(next, 'sell', { amount: offer.grams }), 'cash', { amount: totalCash });
};

export const declineOffer = (state: GameState, id: number | string) =>
  produce(state, (draft) => {
    draft.offers = (draft.offers || []).filter((o: any) => String(o.id) !== String(id));
  });

export const deliverApotheke = (state: GameState, id: number | string) => {
  const offers = state.apothekenOffers || [];
  const idx = offers.findIndex((o: any) => String(o.id) === String(id));
  if (idx === -1) return state;
  const offer: any = offers[idx];
  if (offer.expiresAt <= Date.now()) {
    return produce(state, (draft) => {
      draft.apothekenOffers = (draft.apothekenOffers || []).filter((o: any) => String(o.id) !== String(id));
    });
  }
  if (state.grams < offer.grams) return state;
  let totalCash = 0;
  const next = produce(state, (draft) => {
    const avgQ = (draft.qualityPool.grams || 0) > 0 ? draft.qualityPool.weighted / draft.qualityPool.grams : 1;
    const qMult = saleQualityMultiplier(avgQ);
    const total = offer.grams * offer.pricePerG * qMult;
    totalCash = total;
    draft.grams -= offer.grams;
    const usedWeighted = Math.min(draft.qualityPool.weighted || 0, avgQ * offer.grams);
    draft.qualityPool.grams = Math.max(0, (draft.qualityPool.grams || 0) - offer.grams);
    draft.qualityPool.weighted = Math.max(0, (draft.qualityPool.weighted || 0) - usedWeighted);
    draft.cash += total;
    draft.totalCashEarned += total;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
    draft.apothekenOffers = (draft.apothekenOffers || []).filter((o: any) => o.id !== id);
    addXP(draft as any, 12);
  });
  return checkQuestProgress(checkQuestProgress(next, 'sell', { amount: offer.grams }), 'cash', { amount: totalCash });
};

export const declineOrder = (state: GameState, id: number | string) =>
  produce(state, (draft) => {
    draft.orders = (draft.orders || []).filter((o: any) => String(o.id) !== String(id));
  });

export const deliverOrder = (state: GameState, id: number | string) => {
  const idx = state.orders.findIndex((o: any) => String(o.id) === String(id));
  if (idx === -1) return state;
  const order: any = state.orders[idx];
  if (order.expiresAt <= Date.now()) {
    return produce(state, (draft) => {
      draft.orders = draft.orders.filter((o: any) => String(o.id) !== String(id));
    });
  }
  if (state.grams < order.grams) return state;
  let totalCash = 0;
  const next = produce(state, (draft) => {
    const avgQ = (draft.qualityPool.grams || 0) > 0 ? draft.qualityPool.weighted / draft.qualityPool.grams : 1;
    const qMult = saleQualityMultiplier(avgQ);
    const total = order.grams * order.pricePerG * qMult;
    totalCash = total;
    draft.grams -= order.grams;
    const usedWeighted = Math.min(draft.qualityPool.weighted || 0, avgQ * order.grams);
    draft.qualityPool.grams = Math.max(0, (draft.qualityPool.grams || 0) - order.grams);
    draft.qualityPool.weighted = Math.max(0, (draft.qualityPool.weighted || 0) - usedWeighted);
    draft.cash += total;
    draft.totalCashEarned += total;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
    draft.reputation = (draft.reputation || 0) + 1;
    draft.orders = draft.orders.filter((o: any) => String(o.id) !== String(id));
    addXP(draft as any, 12);
  });
  return checkQuestProgress(checkQuestProgress(next, 'sell', { amount: order.grams }), 'cash', { amount: totalCash });
};

export const doPrestige = (state: GameState) => {
  const gain = calcPrestigeGain(state.totalEarned);
  if (gain <= 0) return state;
  const theme = state.theme;
  return produce(createInitialState(), (draft) => {
    draft.hazePoints = state.hazePoints + gain;
    draft.resets = (state.resets || 0) + 1;
    draft.timeSpeed = state.timeSpeed || 1;
    draft.slotsUnlocked = 3;
    draft.theme = theme;
    draft.welcomeRewarded = true;
  });
};

export const applyForJob = (state: GameState, jobId: string) => {
  const job = JOBS.find((j) => j.id === jobId);
  if (!job) return state;
  if ((state.level || 1) < job.reqLevel) return state;
  if (state.jobId === jobId) return state;
  const alreadyPending = (state.applications || []).some((a) => a.jobId === jobId);
  if (alreadyPending) return state;
  return produce(state, (draft) => {
    const days = draft.gameDaysTotal || 0;
    draft.applications = draft.applications || [];
    draft.applications.push({ jobId, decideAt: days + 3 });
    pushMessage(draft as any, `Bewerbung bei ${job.name} eingereicht. Antwort in ~3 Tagen.`, 'info');
  });
};

export const takeJob = (state: GameState, jobId: string) => {
  const job = JOBS.find((j) => j.id === jobId);
  if (!job) return state;
  return produce(state, (draft) => {
    draft.jobId = jobId;
  });
};

export const fireJob = (state: GameState) =>
  produce(state, (draft) => {
    draft.jobId = null;
  });

const processApplications = (state: GameState) => {
  const days = state.gameDaysTotal || 0;
  const pending: any[] = [];
  for (const app of state.applications || []) {
    if (days >= (app as any).decideAt) {
      const job = JOBS.find((j) => j.id === app.jobId);
      if (!job) continue;
      const lvl = state.level || 1;
      const prob = job.base * Math.min(1, lvl / Math.max(1, job.reqLevel));
      const accepted = Math.random() < prob;
      if (accepted) {
        state.jobId = job.id;
        pushMessage(state, `Bewerbung bei ${job.name}: Angenommen!`, 'success');
      } else {
        pushMessage(state, `Bewerbung bei ${job.name}: Abgelehnt.`, 'warning');
      }
    } else {
      pending.push(app);
    }
  }
  state.applications = pending;
};

const addXP = (state: GameState, amt: number) => {
  amt = Math.max(0, Math.floor(amt || 0));
  if (amt <= 0) return;
  state.xp = (state.xp || 0) + amt;
  const prevLevel = state.level || 1;
  while (state.xp >= xpForNext(state.level || 1)) {
    state.xp -= xpForNext(state.level || 1);
    state.level = (state.level || 1) + 1;
  }
  if (state.level !== prevLevel) {
    syncQuests(state);
    state.quests = (state.quests || []).map((qp) => {
      const quest = QUESTS.find((q) => q.id === qp.id);
      if (!quest) return qp;
      const tasks = qp.tasks.map((t) => {
        const target = t.amount ?? (t as any).required;
        if (t.type === 'level' && (state.level || 1) >= target) return { ...t, current: target };
        return { ...t, amount: target };
      });
      const allDone = tasks.every((t) => (t.current || 0) >= (t.amount ?? (t as any).required));
      const status: QuestProgress['status'] = qp.status === 'claimed' ? 'claimed' : allDone ? 'ready' : qp.status;
      return { ...qp, tasks, status };
    });
  }
};

export const xpForNext = (level: number) => {
  level = Math.max(1, level || 1);
  return Math.floor(100 * Math.pow(1.35, level - 1));
};

const clampQualityValue = (q: number) => clamp(q, 0.4, CURING_QUALITY_CAP);

const syncQuests = (state: GameState) => {
  ensureQuestState(state);
  const level = state.level || 1;
  for (const quest of QUESTS) {
    const meetsLevel = (quest.requirements?.minLevel || 0) <= level;
    const prevDone = quest.requirements?.prevQuestId ? (state.completedQuests || []).includes(quest.requirements.prevQuestId) : true;
    const already = state.quests?.some((q) => q.id === quest.id);
    const done = state.completedQuests?.includes(quest.id);
    if (meetsLevel && prevDone && !already && !done) {
      const progress: QuestProgress = {
        id: quest.id,
        tasks: quest.tasks.map((t) => {
          const amt = typeof (t as any).required === 'number' ? (t as any).required : t.amount;
          const baseCurrent = t.type === 'level' && level >= amt ? amt : 0;
          return { ...t, amount: amt, current: baseCurrent };
        }),
        status: 'active'
      };
      progress.status = progress.tasks.every((t) => (t.current || 0) >= (t.amount ?? (t as any).required)) ? 'ready' : 'active';
      state.quests?.push(progress);
    }
  }
  state.quests = (state.quests || []).map((qp) => {
    const quest = QUESTS.find((q) => q.id === qp.id);
    if (!quest) return qp;
    const allDone = qp.tasks.every((t) => (t.current || 0) >= (t.amount || (t as any).required));
    return { ...qp, status: qp.status === 'claimed' ? 'claimed' : allDone ? 'ready' : 'active' };
  });
  state.activeQuests = (state.quests || []).filter((q) => q.status !== 'claimed').map((q) => q.id);
  state.completedQuests = (state.quests || []).filter((q) => q.status === 'claimed').map((q) => q.id);
};

const checkAchievements = (state: GameState) => {
  state.unlockedAchievements = state.unlockedAchievements || [];
  let unlocked = false;
  for (const ach of ACHIEVEMENTS) {
    if (state.unlockedAchievements.includes(ach.id)) continue;
    if (ach.condition(state)) {
      state.unlockedAchievements.push(ach.id);
      if (ach.reward.type === 'haze') {
        state.hazePoints = (state.hazePoints || 0) + ach.reward.amount;
      }
      pushMessage(state, `🏆 Erfolg freigeschaltet: ${ach.title}`, 'success');
      unlocked = true;
    }
  }
  return unlocked;
};

const triggerMarketEvent = (state: GameState) => {
  const ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
  state.marketNews = ev.name;
  state.marketNewsMult = ev.type === 'festival' ? 1.2 : 1;
  state.marketNewsTimer = ev.duration;
  if (ev.type === 'festival') state.marketMult *= 1.2;
  if (ev.type === 'heatwave') state.eventWaterMult = 1.5;
  pushMessage(state, `${ev.name}: ${ev.desc}`, 'event');
};

const applyQuestRewards = (state: GameState, questId: string) => {
  const quest = QUESTS.find((q) => q.id === questId);
  if (!quest) return;
  ensureConsumables(state);
  for (const reward of quest.rewards) {
    if (reward.cash) {
      state.cash += reward.cash;
      state.totalCashEarned += reward.cash;
    }
    if (reward.xp) {
      addXP(state as any, reward.xp);
    }
    if (reward.item) {
      state.itemsOwned[reward.item] = (state.itemsOwned[reward.item] || 0) + (reward.count || 1);
    }
    if (reward.consumable) {
      const count = reward.count || 1;
      if (reward.consumable === 'coffee_premium') state.consumables.coffee += count;
      if (reward.consumable === 'fungicide') state.consumables.fungicide += count;
      if (reward.consumable === 'spray') state.consumables.spray += count;
      if (reward.consumable === 'nutrient') state.consumables.nutrient += count;
      if (reward.consumable === 'beneficials') state.consumables.beneficials += count;
    }
    if (reward.seed) {
      state.seeds[reward.seed] = (state.seeds[reward.seed] || 0) + (reward.count || 1);
    }
    if (reward.message) {
      pushMessage(state, String(reward.message));
    }
  }
};

const matchesQuestTask = (task: any, action: string, payload: any) => {
  if (!task) return false;
  if (task.type !== action) return false;
  if (task.target && payload?.target && String(task.target) !== String(payload.target)) return false;
  if (task.target && payload?.strainId && String(task.target) !== String(payload.strainId)) return false;
  return true;
};

export const checkQuestProgress = (state: GameState, action: 'harvest' | 'sell' | 'cash' | 'level', payload?: any) => {
  return produce(state, (draft) => {
    ensureQuestState(draft as any);
    syncQuests(draft as any);
    let anyReady = false;
    for (const qp of draft.quests || []) {
      if (qp.status === 'claimed') continue;
      const quest = QUESTS.find((q) => q.id === qp.id);
      if (!quest) continue;
      qp.tasks = qp.tasks.map((t, idx) => {
        const def = quest.tasks[idx] || t;
        let current = t.current || 0;
        const increment = payload?.amount ?? payload?.value ?? payload?.count ?? 1;
        if (matchesQuestTask(def, action, payload)) {
          const targetAmt = def.amount ?? (def as any).required;
          current = Math.min(targetAmt, current + increment);
        }
        const targetAmt = def.amount ?? (def as any).required;
        if (def.type === 'level' && (payload?.level || draft.level) >= targetAmt) {
          current = targetAmt;
        }
        return { ...def, amount: targetAmt, current };
      });
      if (qp.tasks.every((t) => (t.current || 0) >= (t.amount ?? (t as any).required))) {
        qp.status = 'ready';
        anyReady = true;
      }
    }
    draft.activeQuests = (draft.quests || []).filter((q) => q.status !== 'claimed').map((q) => q.id);
    if (anyReady) {
      pushMessage(draft as any, 'Quest bereit zum Abholen!', 'success');
    }
  });
};

export const claimQuestReward = (state: GameState, questId: string) => {
  return produce(state, (draft) => {
    ensureQuestState(draft as any);
    const qp = (draft.quests || []).find((q) => q.id === questId);
    if (!qp || qp.status !== 'ready') return;
    applyQuestRewards(draft as any, questId);
    qp.status = 'claimed';
    draft.completedQuests = Array.from(new Set([...(draft.completedQuests || []), questId]));
    draft.activeQuests = (draft.quests || []).filter((q) => q.status !== 'claimed').map((q) => q.id);
    pushMessage(draft as any, `Quest "${questId}" abgeschlossen!`, 'success');
  });
};

const fillDryingSlots = (proc: ProcessingState) => {
  while ((proc.drying || []).length < (proc.slots?.drying || 0) && (proc.wet || []).length > 0) {
    const wet = proc.wet.shift();
    if (!wet) break;
    proc.drying.push({
      id: wet.id,
      strainId: wet.strainId,
      wetGrams: wet.grams,
      quality: wet.quality,
      remaining: DRYING_TIME_SEC,
      total: DRYING_TIME_SEC,
      startedAt: Date.now()
    });
  }
};

const advanceProcessing = (state: GameState, worldDt: number) => {
  if (worldDt <= 0) return;
  const proc = ensureProcessing(state);
  proc.drying = (proc.drying || []).filter((job) => {
    job.remaining = Math.max(0, job.remaining - worldDt);
    if (job.remaining <= 0) {
      const grams = Math.max(0, job.wetGrams * DRY_WEIGHT_MULT);
      const q = clampQualityValue(job.quality * DRY_PRICE_MULT);
      proc.ready.push({ id: job.id, strainId: job.strainId, grams, quality: q, stage: 'dry', createdAt: Date.now() });
      return false;
    }
    return true;
  });

  proc.curing = (proc.curing || []).filter((job) => {
    const total = job.total || CURING_TIME_SEC;
    const startQ = job.startQuality ?? job.quality;
    job.remaining = Math.max(0, job.remaining - worldDt);
    const progress = clamp(1 - job.remaining / total, 0, 1);
    job.quality = clampQualityValue(startQ + (job.targetQuality - startQ) * progress);
    if (job.remaining <= 0) {
      proc.ready.push({
        id: job.id,
        strainId: job.strainId,
        grams: job.grams,
        quality: job.targetQuality,
        stage: 'cured',
        createdAt: Date.now()
      });
      return false;
    }
    return true;
  });

  fillDryingSlots(proc);
};

export const startDrying = (state: GameState, batchId?: string) => {
  const proc = ensureProcessing(state);
  const hasSpace = (proc.slots?.drying || 0) > (proc.drying || []).length;
  if (!hasSpace || (proc.wet || []).length === 0) return state;
  return produce(state, (draft) => {
    const p = ensureProcessing(draft);
    if (!batchId) {
      fillDryingSlots(p);
      return;
    }
    const idx = batchId ? p.wet.findIndex((b) => b.id === batchId) : 0;
    if (idx === -1) return;
    const wet = p.wet.splice(idx, 1)[0];
    if (!wet) return;
    p.drying.push({
      id: wet.id,
      strainId: wet.strainId,
      wetGrams: wet.grams,
      quality: wet.quality,
      remaining: DRYING_TIME_SEC,
      total: DRYING_TIME_SEC,
      startedAt: Date.now()
    });
  });
};

export const startCuring = (state: GameState, batchId: string) => {
  const proc = ensureProcessing(state);
  if ((proc.curing || []).length >= (proc.slots?.curing || 0)) return state;
  const readyIdx = (proc.ready || []).findIndex((b) => b.id === batchId && b.stage === 'dry');
  if (readyIdx === -1) return state;
  return produce(state, (draft) => {
    const p = ensureProcessing(draft);
    const idx = (p.ready || []).findIndex((b) => b.id === batchId && b.stage === 'dry');
    if (idx === -1) return;
    const batch = p.ready.splice(idx, 1)[0];
    const duration = CURING_TIME_SEC;
    const target = clampQualityValue(batch.quality * (1 + CURING_QUALITY_BONUS));
    p.curing.push({
      id: batch.id,
      strainId: batch.strainId,
      grams: batch.grams,
      quality: batch.quality,
      startQuality: batch.quality,
      targetQuality: target,
      remaining: duration,
      total: duration,
      startedAt: Date.now()
    });
  });
};

export const collectProcessed = (state: GameState, batchId: string) => {
  const proc = ensureProcessing(state);
  const idx = (proc.ready || []).findIndex((b) => b.id === batchId);
  if (idx === -1) return state;
  return produce(state, (draft) => {
    const p = ensureProcessing(draft);
    const i = (p.ready || []).findIndex((b) => b.id === batchId);
    if (i === -1) return;
    const batch = p.ready.splice(i, 1)[0];
    const q = clampQualityValue(batch.quality);
    draft.grams += batch.grams;
    draft.totalEarned += batch.grams;
    draft.qualityPool.grams = (draft.qualityPool.grams || 0) + batch.grams;
    draft.qualityPool.weighted = (draft.qualityPool.weighted || 0) + batch.grams * q;
    addXP(draft as any, Math.max(1, Math.floor(batch.grams / 40)));
  });
};

export const collectAllProcessed = (state: GameState) => {
  const proc = ensureProcessing(state);
  if ((proc.ready || []).length === 0) return state;
  return produce(state, (draft) => {
    const p = ensureProcessing(draft);
    for (const batch of p.ready) {
      const q = clampQualityValue(batch.quality);
      draft.grams += batch.grams;
      draft.totalEarned += batch.grams;
      draft.qualityPool.grams = (draft.qualityPool.grams || 0) + batch.grams;
      draft.qualityPool.weighted = (draft.qualityPool.weighted || 0) + batch.grams * q;
      addXP(draft as any, Math.max(1, Math.floor(batch.grams / 40)));
    }
    p.ready = [];
  });
};

export const pressRosin = (state: GameState, batchId: string) => {
  const proc = ensureProcessing(state);
  const idx = (proc.ready || []).findIndex((b) => b.id === batchId);
  if (idx === -1) return state;
  const batch = proc.ready[idx];
  if ((batch.quality || 0) >= ROSIN_MIN_QUALITY) return state;
  return produce(state, (draft) => {
    const p = ensureProcessing(draft);
    const i = (p.ready || []).findIndex((b) => b.id === batchId);
    if (i === -1) return;
    const b = p.ready.splice(i, 1)[0];
    const output = Math.max(0, b.grams * ROSIN_YIELD_MULT);
    draft.concentrates = (draft.concentrates || 0) + output;
    addXP(draft as any, Math.max(1, Math.floor(output / 5)));
    pushMessage(draft as any, `Rosin gewonnen: ${fmtNumber(output)}g`, 'success');
  });
};

export const harvestPlant = (state: GameState, slotIndex: number) => {
  const idx = state.plants.findIndex((p) => p.slot === slotIndex);
  if (idx === -1) return state;
  const plant = state.plants[idx];
  if (plant.growProg < 1) return state;
  const qm = qualityMultiplier(state, plant);
  const mastery = masteryForStrain(state, plant.strainId);
  const qBonus = mastery.level >= 10 && Math.random() < 0.15 ? qm * 2 : qm;
  const yd = harvestYieldDetails(state, plant);
  const gain = clampYield(yd.value * qm, (yd.breakdown.cap || yd.value) * qm);
  const dryEstimate = gain * DRY_WEIGHT_MULT;
  const next = produce(state, (draft) => {
    draft.itemsOwned = draft.itemsOwned || {};
    if ((draft.itemsOwned['shears'] || 0) > 0) {
      draft.itemsOwned['shears'] = Math.max(0, (draft.itemsOwned['shears'] || 0) - 1);
    }
    addMasteryXp(draft as any, plant.strainId, 10);
    const proc = ensureProcessing(draft);
    proc.wet.push({ id: uid(), strainId: plant.strainId, grams: gain, quality: qBonus, stage: 'wet', createdAt: Date.now() });
    fillDryingSlots(proc);
    draft.plants = draft.plants.filter((p) => p.slot !== slotIndex);
    const tierBonus = qm >= 1.3 ? 1.5 : qm >= 1.1 ? 1.2 : 1;
    addXP(draft as any, Math.max(1, Math.floor((dryEstimate / 50) * tierBonus)));
    if (draft.autoGrow?.[plant.strainId] && (draft.seeds[plant.strainId] || 0) > 0 && slotIndex < (draft.slotsUnlocked || 0)) {
      draft.seeds[plant.strainId] = Math.max(0, (draft.seeds[plant.strainId] || 0) - 1);
      draft.plants.push(createPlant(plant.strainId, slotIndex));
    }
  });
  return checkQuestProgress(next, 'harvest', { strainId: plant.strainId, amount: gain });
};

export const harvestPlantWithBonus = (state: GameState, slotIndex: number, bonus = 1) => {
  const idx = state.plants.findIndex((p) => p.slot === slotIndex);
  if (idx === -1) return state;
  const plant = state.plants[idx];
  if (plant.growProg < 1) return state;
  const qm = qualityMultiplier(state, plant);
  const mastery = masteryForStrain(state, plant.strainId);
  const qBonus = mastery.level >= 10 && Math.random() < 0.15 ? qm * 2 : qm;
  const yd = harvestYieldDetails(state, plant);
  const gain = clampYield(yd.value * qm * bonus, (yd.breakdown.cap || yd.value) * qm * Math.max(1, bonus));
  const dryEstimate = gain * DRY_WEIGHT_MULT;
  const next = produce(state, (draft) => {
    draft.itemsOwned = draft.itemsOwned || {};
    if ((draft.itemsOwned['shears'] || 0) > 0) {
      draft.itemsOwned['shears'] = Math.max(0, (draft.itemsOwned['shears'] || 0) - 1);
    }
    addMasteryXp(draft as any, plant.strainId, 10);
    if (bonus >= 1.4) {
      draft.perfectHarvests = (draft.perfectHarvests || 0) + 1;
      draft.perfectStreak = (draft.perfectStreak || 0) + 1;
    } else {
      draft.perfectStreak = 0;
    }
    const proc = ensureProcessing(draft);
    proc.wet.push({ id: uid(), strainId: plant.strainId, grams: gain, quality: qBonus, stage: 'wet', createdAt: Date.now() });
    fillDryingSlots(proc);
    draft.plants = draft.plants.filter((p) => p.slot !== slotIndex);
    const tierBonus = qm >= 1.3 ? 1.5 : qm >= 1.1 ? 1.2 : 1;
    addXP(draft as any, Math.max(1, Math.floor((dryEstimate / 50) * tierBonus * bonus)));
    if (draft.autoGrow?.[plant.strainId] && (draft.seeds[plant.strainId] || 0) > 0 && slotIndex < (draft.slotsUnlocked || 0)) {
      draft.seeds[plant.strainId] = Math.max(0, (draft.seeds[plant.strainId] || 0) - 1);
      draft.plants.push(createPlant(plant.strainId, slotIndex));
    }
  });
  return checkQuestProgress(next, 'harvest', { strainId: plant.strainId, amount: gain });
};

export const removePlant = (state: GameState, slotIndex: number) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  return produce(state, (draft) => {
    if (plant) {
      const strainId = plant.strainId;
      draft.seeds[strainId] = (draft.seeds[strainId] || 0) + 1;
    }
    draft.plants = draft.plants.filter((p) => p.slot !== slotIndex);
  });
};

export const waterPlant = (state: GameState, slotIndex: number) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  if (!plant) return state;
  if ((state.cash || 0) < WATER_COST) return state;
  return produce(state, (draft: any) => {
    draft.cash = Math.max(0, (draft.cash || 0) - WATER_COST);
    const p = draft.plants.find((pl: any) => pl.slot === slotIndex);
    if (p) p.water = Math.min(WATER_MAX, (p.water || 0) + WATER_ADD_AMOUNT);
  });
};

export const feedPlant = (state: GameState, slotIndex: number) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  if (!plant) return state;
  const ensured = ensureConsumables(state);
  if (ensured.consumables.nutrient <= 0) return ensured;
  return produce(ensured, (draft: any) => {
    draft.consumables.nutrient -= 1;
    const p = draft.plants.find((pl: any) => pl.slot === slotIndex);
    if (p) {
      p.nutrients = Math.min(NUTRIENT_MAX, (p.nutrients || 0) + NUTRIENT_ADD_AMOUNT);
      p.quality = clamp((p.quality || 1) + 0.04, 0.4, 1.5);
      if (draft.consumables.pgr && draft.consumables.pgr > 0) {
        draft.consumables.pgr -= 1;
        p.pgrBoostSec = (p.pgrBoostSec || 0) + PGR_BOOST_SEC;
      }
    }
  });
};

export const feedPlantWithBonus = (state: GameState, slotIndex: number, bonus = 1) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  if (!plant) return state;
  const ensured = ensureConsumables(state);
  if (ensured.consumables.nutrient <= 0) return ensured;
  return produce(ensured, (draft: any) => {
    draft.consumables.nutrient -= 1;
    const p = draft.plants.find((pl: any) => pl.slot === slotIndex);
    if (p) {
      p.nutrients = Math.min(NUTRIENT_MAX, (p.nutrients || 0) + NUTRIENT_ADD_AMOUNT);
      const qualityBoost = 0.04 * bonus;
      p.quality = clamp((p.quality || 1) + qualityBoost, 0.4, 1.5);
      if (draft.consumables.pgr && draft.consumables.pgr > 0) {
        draft.consumables.pgr -= 1;
        p.pgrBoostSec = (p.pgrBoostSec || 0) + PGR_BOOST_SEC;
      }
    }
  });
};

export const treatPlant = (state: GameState, slotIndex: number) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  if (!plant || !plant.pest) return state;
  const ensured = ensureConsumables(state);
  const type = plant.pest.id;
  return produce(ensured, (draft: any) => {
    const p = draft.plants.find((pl: any) => pl.slot === slotIndex);
    if (!p || !p.pest) return;
    if (type === 'mold' || type === 'root_rot' || type === 'leaf_rot') {
      if (draft.consumables.fungicide > 0) {
        draft.consumables.fungicide -= 1;
        p.pest = null;
      }
    } else if (type === 'mites' || type === 'thrips') {
      if (draft.consumables.spray > 0) {
        draft.consumables.spray -= 1;
        p.pest = null;
      } else if (draft.consumables.beneficials > 0) {
        draft.consumables.beneficials -= 1;
        p.pest = null;
      }
    }
  });
};

export const bulkWater = (state: GameState) => {
  const threshold = state.bulkConserve ? 0.5 : 0.6;
  const needy = state.plants.filter((p: any) => p.water < WATER_MAX * threshold && p.health > 0);
  if (needy.length === 0) return state;
  const maxAffordable = Math.floor((state.cash || 0) / WATER_COST);
  if (maxAffordable <= 0) return state;
  const toWater = Math.min(needy.length, maxAffordable);
  return produce(state, (draft: any) => {
    let budget = draft.cash || 0;
    let watered = 0;
    for (const plant of draft.plants) {
      if (watered >= toWater) break;
      if (plant.water < WATER_MAX * threshold && plant.health > 0 && budget >= WATER_COST) {
        plant.water = Math.min(WATER_MAX, plant.water + WATER_ADD_AMOUNT);
        budget -= WATER_COST;
        watered += 1;
      }
    }
    draft.cash = budget;
  });
};

export const bulkFeed = (state: GameState) => {
  const ensured = ensureConsumables(state);
  const threshold = ensured.bulkConserve ? 0.5 : 0.65;
  const hungry = ensured.plants.filter((p: any) => p.nutrients < NUTRIENT_MAX * threshold && p.health > 0);
  if (hungry.length === 0 || ensured.consumables.nutrient <= 0) return ensured;
  return produce(ensured, (draft: any) => {
    let remaining = draft.consumables.nutrient;
    for (const plant of draft.plants) {
      if (remaining <= 0) break;
      if (plant.nutrients < NUTRIENT_MAX * threshold && plant.health > 0) {
        plant.nutrients = Math.min(NUTRIENT_MAX, plant.nutrients + NUTRIENT_ADD_AMOUNT);
        plant.quality = clamp((plant.quality || 1) + 0.04, 0.4, 1.5);
        remaining -= 1;
      }
    }
    draft.consumables.nutrient = Math.max(0, remaining);
  });
};

type QuickBuyType = 'water' | 'nutrient' | 'spray';
export const quickBuyApply = (state: GameState, type: QuickBuyType, slot: number, pack?: boolean) => {
  const plant = state.plants.find((p) => p.slot === slot);
  if (!plant) return state;
  const costMap: Record<QuickBuyType, number> = { water: 0.5, nutrient: 0.8, spray: 1.2 };
  const singleCost = costMap[type] || 0.5;
  const count = pack ? 5 : 1;
  const cost = singleCost * count;
  if ((state.cash || 0) < cost) return state;
  return produce(state, (draft) => {
    draft.cash -= cost;
    const p = draft.plants.find((pl: any) => pl.slot === slot);
    if (!p) return;
    if (type === 'water') {
      p.water = Math.min(WATER_MAX, (p.water || 0) + WATER_ADD_AMOUNT);
      draft.consumables.water = Math.max(0, (draft.consumables.water || 0) + (count - 1));
    }
    if (type === 'nutrient') {
      p.nutrients = Math.min(NUTRIENT_MAX, (p.nutrients || 0) + NUTRIENT_ADD_AMOUNT);
      p.quality = clamp((p.quality || 1) + 0.04, 0.4, 1.5);
      const extra = Math.max(0, count - 1);
      draft.consumables.nutrient = Math.max(0, (draft.consumables.nutrient || 0) + extra);
    }
    if (type === 'spray') {
      draft.consumables.spray = Math.max(0, (draft.consumables.spray || 0) + count);
      if (p.pest) {
        p.pest = null;
        draft.consumables.spray = Math.max(0, draft.consumables.spray - 1);
      }
    }
  });
};

export const harvestAllReady = (state: GameState) => {
  let totalGain = 0;
  const next = produce(state, (draft) => {
    const proc = ensureProcessing(draft);
    const ready = draft.plants.filter((p) => p.growProg >= 1);
    ready.forEach((p) => {
      const qm = qualityMultiplier(draft as any, p);
      const mastery = masteryForStrain(draft as any, p.strainId);
      const qBonus = mastery.level >= 10 && Math.random() < 0.15 ? qm * 2 : qm;
      const gain = harvestYieldFor(draft as any, p) * qm;
      totalGain += gain;
      const dryEstimate = gain * DRY_WEIGHT_MULT;
      proc.wet.push({ id: uid(), strainId: p.strainId, grams: gain, quality: qBonus, stage: 'wet', createdAt: Date.now() });
      addXP(draft as any, Math.max(1, Math.floor(dryEstimate / 50)));
      addMasteryXp(draft as any, p.strainId, 10);
    });
    draft.plants = draft.plants.filter((p) => p.growProg < 1);
    fillDryingSlots(proc);
    if (draft.autoGrow) {
      ready.forEach((p) => {
        if (draft.autoGrow?.[p.strainId] && (draft.seeds[p.strainId] || 0) > 0 && p.slot < (draft.slotsUnlocked || 0)) {
          draft.seeds[p.strainId] = Math.max(0, (draft.seeds[p.strainId] || 0) - 1);
          draft.plants.push(createPlant(p.strainId, p.slot));
        }
      });
    }
  });
  if (totalGain > 0) {
    return checkQuestProgress(next, 'harvest', { amount: totalGain });
  }
  return next;
};

export const unlockSlot = (state: GameState) => {
  const unlocked = Math.max(0, state.slotsUnlocked || 0);
  const cap = currentMaxSlots(state);
  if (unlocked >= cap) return state;
  const cost = slotUnlockCost(unlocked);
  if (state.grams < cost) return state;
  return produce(state, (draft) => {
    draft.grams -= cost;
    draft.slotsUnlocked = Math.min(cap, unlocked + 1);
  });
};

export const plantSeed = (state: GameState, slotIndex: number, strainId: string) => {
  const unlocked = Math.max(0, state.slotsUnlocked || 0);
  if (slotIndex >= unlocked) return state;
  if (state.plants.some((p) => p.slot === slotIndex)) return state;
  if ((state.seeds[strainId] || 0) <= 0) return state;
  return produce(state, (draft) => {
    draft.seeds[strainId] = Math.max(0, (draft.seeds[strainId] || 0) - 1);
    draft.plants.push(createPlant(strainId, slotIndex));
    addXP(draft as any, 6);
  });
};

export const buySeed = (state: GameState, strainId: string) => {
  const strain = STRAINS.find((s) => s.id === strainId);
  if (!strain) return state;
  const count = state.purchasedCount[strainId] || 0;
  const cost = seedCost(state, strainId, count);
  if (state.cash < cost) return state;
  return produce(state, (draft) => {
    draft.cash -= cost;
    draft.purchasedCount[strainId] = count + 1;
    draft.seeds[strainId] = (draft.seeds[strainId] || 0) + 1;
  });
};

export const seedCost = (state: GameState, strainId: string, currentCount?: number) => {
  const strain = STRAINS.find((s) => s.id === strainId);
  if (!strain) return 0;
  const count = typeof currentCount === 'number' ? currentCount : state.purchasedCount[strainId] || 0;
  let cost = Math.round(strain.cost * Math.pow(1.18, count));
  const eff = researchEffects(state);
  cost = Math.max(1, Math.round(cost * (1 - (eff.cost || 0))));
  return cost;
};

export const upgradePlant = (state: GameState, slotIndex: number) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  if (!plant) return state;
  const cost = plantUpgradeCost(state, plant);
  if (state.grams < cost) return state;
  return produce(state, (draft) => {
    draft.grams -= cost;
    const p = draft.plants.find((pl) => pl.slot === slotIndex);
    if (p) p.level += 1;
  });
};

export const buyItem = (state: GameState, itemId: string) => {
  const item = ITEMS.find((i) => i.id === itemId);
  if (!item) return state;
  const stackable = !!item.stack;
  const owned = state.itemsOwned[item.id] || 0;
  if (!stackable && owned >= 1) return state;
  const cost = itemCost(state, itemId);
  if (state.cash < cost) return state;
  return produce(state, (draft) => {
    draft.cash -= cost;
    draft.itemsOwned[itemId] = (draft.itemsOwned[itemId] || 0) + 1;
  });
};

export const itemCost = (state: GameState, itemId: string) => {
  const item = ITEMS.find((i) => i.id === itemId);
  if (!item) return 0;
  const count = state.itemsOwned[itemId] || 0;
  const eff = researchEffects(state);
  const base = item.cost * Math.pow(1.2, count);
  return Math.max(1, Math.round(base * (1 - (eff.cost || 0))));
};

export const buyConsumablePack = (state: GameState, packId: string) => {
const pack = CONSUMABLE_PACKS.find((p) => p.id === packId);
  if (!pack) return state;
  if (state.cash < pack.price) return state;
  return produce(state, (draft) => {
    draft.cash -= pack.price;
    ensureConsumables(draft);
    draft.consumables.nutrient += pack.add.nutrient || 0;
    draft.consumables.spray += pack.add.spray || 0;
    draft.consumables.fungicide += pack.add.fungicide || 0;
    draft.consumables.beneficials += pack.add.beneficials || 0;
    draft.consumables.pgr = (draft.consumables.pgr || 0) + (pack.add.pgr || 0);
    draft.consumables.coffee = (draft.consumables.coffee || 0) + (pack.add.coffee || 0);
  });
};

export const openCase = (state: GameState, caseId: string, fast = false) => {
  const configs = buildCaseConfigs(getAllStrains(state));
  const cfg = configs.find((c) => c.id === caseId);
  if (!cfg) return state;
  if (state.cash < cfg.price) return state;
  return produce(state, (draft) => {
    draft.cash -= cfg.price;
    const loot = (cfg.lootBuilder as () => any)() as ReturnType<typeof cfg.lootBuilder>;
    const totalWeight = loot.reduce((sum, l) => sum + l.weight, 0);
    let roll = Math.random() * totalWeight;
    let winner = loot[0];
    for (const item of loot) {
      roll -= item.weight;
      if (roll <= 0) {
        winner = item;
        break;
      }
    }
    draft.seeds[winner.strainId] = (draft.seeds[winner.strainId] || 0) + 1;
    draft.caseInventory[winner.strainId] = (draft.caseInventory[winner.strainId] || 0) + 1;
    draft.caseStats = draft.caseStats || defaultCaseStats();
    draft.caseStats.opened += 1;
    if (fast) draft.caseStats.fastOpened += 1;
    draft.caseStats.lastDrop = getStrain(draft as any, winner.strainId).name;
    draft.caseStats.lastRarity = winner.rarity;
    draft.caseStats.lastEmoji = rarityEmoji(winner.rarity);
    if (!draft.caseStats.bestRarity || rarityOrder(winner.rarity) > rarityOrder(draft.caseStats.bestRarity as Rarity)) {
      draft.caseStats.bestDrop = draft.caseStats.lastDrop;
      draft.caseStats.bestRarity = winner.rarity;
      draft.caseStats.bestEmoji = draft.caseStats.lastEmoji;
    }
    addXP(draft as any, 6);
  });
};

const rarityOrder = (rarity: Rarity) => CASE_RARITIES.indexOf(rarity);
const rarityEmoji = (rarity: Rarity) => {
  switch (rarity) {
    case 'common':
      return '🟢';
    case 'uncommon':
      return '🔵';
    case 'rare':
      return '🟣';
    case 'epic':
      return '🟠';
    case 'legendary':
      return '🟡';
    default:
      return '❔';
  }
};

const spawnMarketEvent = (state: GameState) => {
  const roll = Math.random();
  if (roll < 0.5) {
    state.marketEventName = 'Inspektion';
    state.marketMult = 0.7;
    state.marketTimer = 30;
  } else {
    state.marketEventName = 'Hype';
    state.marketMult = 1.25;
    state.marketTimer = 30;
  }
  state.nextMarketEventIn = 90 + Math.random() * 60;
};

const marketDrift = (state: GameState, dt: number) => {
  state.nextMarketShiftIn = Math.max(0, (state.nextMarketShiftIn || 0) - dt);
  if ((state.nextMarketShiftIn || 0) > 0) return;
  const trend = MARKET_TRENDS[Math.floor(Math.random() * MARKET_TRENDS.length)];
  state.marketTrendName = trend.name;
  state.marketTrendMult = trend.mult;
  state.marketTrend = trend.mult > 1 ? 'up' : trend.mult < 1 ? 'down' : 'stable';
  state.nextMarketShiftIn = 600; // alle 10 Minuten
  const price = getSalePricePerGram(state);
  state.priceHistory = (state.priceHistory || []).slice(-19).concat(price);
};

const spawnRandomEvent = (state: GameState) => {
  const events = [
    { type: 'pest_plague', name: 'Pest-Plage', desc: 'Schädlinge sind aggressiver!', duration: 60, apply: (s: GameState) => { s.pestGlobalRate = (PEST_GLOBAL_RATE || 1) * 2; } },
    { type: 'harvest_blessing', name: 'Ernte-Segen', desc: 'Alle Erträge verdoppelt!', duration: 30, apply: (s: GameState) => { s.harvestBonus = 2; } },
    { type: 'growth_boost', name: 'Wachstums-Boost', desc: 'Pflanzen wachsen schneller!', duration: 45, apply: (s: GameState) => { s.growthBonus = 1.5; } },
    { type: 'cash_rain', name: 'Geldregen', desc: 'Zufällige Bargeld-Belohnungen!', duration: 20, apply: (s: GameState) => { (s as any).cashRain = true; } }
  ];
  const ev = events[Math.floor(Math.random() * events.length)];
  state.activeEvents = state.activeEvents || [];
  state.activeEvents.push({ ...ev });
  ev.apply(state);
  pushMessage(state, `${ev.name}: ${ev.desc}`, 'event');
};

export const toggleTheme = (state: GameState, theme: 'light' | 'dark') => produce(state, (draft) => {
  draft.theme = theme;
});

export const setBulkConserve = (state: GameState, on: boolean) =>
  produce(state, (draft) => {
    draft.bulkConserve = on;
  });

export const toggleDisplayPrefs = (state: GameState, { compact, contrast }: { compact?: boolean; contrast?: boolean }) =>
  produce(state, (draft) => {
    if (typeof compact === 'boolean') draft.compactMode = compact;
    if (typeof contrast === 'boolean') draft.highContrast = contrast;
  });

export const setSpeed = (state: GameState, speed: number) =>
  produce(state, (draft) => {
    draft.timeSpeed = SPEED_OPTIONS.includes(speed) ? speed : 0;
  });

export const setDifficulty = (state: GameState, diff: GameState['difficulty']) =>
  produce(state, (draft) => {
    draft.difficulty = diff;
  });

export const setInventoryFilters = (state: GameState, filter: string, sort: string) =>
  produce(state, (draft) => {
    draft.inventoryFilter = filter;
    draft.inventorySort = sort;
  });

export const setAutoGrow = (state: GameState, strainId: string, on: boolean) =>
  produce(state, (draft) => {
    draft.autoGrow = draft.autoGrow || {};
    draft.autoGrow[strainId] = on;
  });

export const toggleFavoriteStrain = (state: GameState, strainId: string) =>
  produce(state, (draft) => {
    draft.favorites = draft.favorites || [];
    const idx = draft.favorites.indexOf(strainId);
    if (idx >= 0) draft.favorites.splice(idx, 1);
    else draft.favorites.unshift(strainId);
  });

const pushMessage = (state: GameState, text: string, type = 'info') => {
  const id = state.nextMsgId || 1;
  state.nextMsgId = id + 1;
  state.messages.push({ id, text, type, createdAt: Date.now(), unread: true });
  state.unreadMessages = (state.unreadMessages || 0) + 1;
};

export const addMessage = (state: GameState, text: string, type = 'info') =>
  produce(state, (draft) => {
    pushMessage(draft as any, text, type);
  });

export const markMessagesRead = (state: GameState) =>
  produce(state, (draft) => {
    draft.messages = draft.messages.map((m) => ({ ...m, unread: false }));
    draft.unreadMessages = 0;
  });

const packPrice = (state: GameState, packId: string) => {
  const pack = CONSUMABLE_PACKS.find((p) => p.id === packId);
  if (!pack) return 0;
  const eff = researchEffects(state);
  const mult = Math.max(0.1, 1 - (eff.cost || 0));
  return Math.round(pack.price * mult);
};

const cartEntryPrice = (state: GameState, entry: CartEntry) => {
  if (entry.kind === 'seed') return seedCost(state, entry.id);
  if (entry.kind === 'item') return itemCost(state, entry.id);
  if (entry.kind === 'consumable') return packPrice(state, entry.id);
  return entry.price || 0;
};

const cartCount = (state: GameState, id: string, kind: CartEntry['kind']) =>
  (state.cart || []).filter((c) => c.id === id && c.kind === kind).reduce((sum, c) => sum + (c.qty || 0), 0);

export const addToCart = (state: GameState, entry: CartEntry) =>
  produce(state, (draft) => {
    draft.cart = draft.cart || [];
    if (entry.kind === 'item') {
      const item = ITEMS.find((i) => i.id === entry.id);
      const stackable = !!item?.stack;
      const owned = draft.itemsOwned[entry.id] || 0;
      const inCart = cartCount(draft as any, entry.id, entry.kind);
      if (!stackable && (owned > 0 || inCart > 0)) return;
    }
    const price = cartEntryPrice(draft as any, entry);
    const name =
      entry.name ||
      (entry.kind === 'seed'
        ? getStrain(draft as any, entry.id).name
        : entry.kind === 'item'
        ? ITEMS.find((i) => i.id === entry.id)?.name
        : CONSUMABLE_PACKS.find((p) => p.id === entry.id)?.name);
    const existing = draft.cart.find((c) => c.id === entry.id && c.kind === entry.kind);
    if (existing) {
      existing.qty += entry.qty;
      existing.price = price;
      if (name) existing.name = name;
    } else {
      draft.cart.push({ ...entry, price, name });
    }
  });

export const clearCart = (state: GameState) => produce(state, (draft) => {
  draft.cart = [];
});

export const checkoutCart = (state: GameState) => {
  let total = 0;
  for (const entry of state.cart) {
    total += cartEntryPrice(state, entry) * entry.qty;
  }
  if (state.cash < total || total <= 0) return state;
  return produce(state, (draft) => {
    draft.cash -= total;
    for (const entry of draft.cart) {
      if (entry.kind === 'seed') {
        draft.purchasedCount[entry.id] = (draft.purchasedCount[entry.id] || 0) + entry.qty;
        draft.seeds[entry.id] = (draft.seeds[entry.id] || 0) + entry.qty;
      }
      if (entry.kind === 'item') {
        const item = ITEMS.find((i) => i.id === entry.id);
        const stackable = !!item?.stack;
        const owned = draft.itemsOwned[entry.id] || 0;
        const addQty = stackable ? entry.qty : Math.max(0, Math.min(1, 1 - owned));
        if (addQty > 0) draft.itemsOwned[entry.id] = owned + addQty;
      }
      if (entry.kind === 'consumable') {
        ensureConsumables(draft);
        const pack = CONSUMABLE_PACKS.find((p) => p.id === entry.id);
        if (pack?.add) {
          draft.consumables.nutrient += pack.add.nutrient || 0;
          draft.consumables.spray += pack.add.spray || 0;
          draft.consumables.fungicide += pack.add.fungicide || 0;
          draft.consumables.beneficials += pack.add.beneficials || 0;
          draft.consumables.pgr = (draft.consumables.pgr || 0) + (pack.add.pgr || 0);
          draft.consumables.coffee = (draft.consumables.coffee || 0) + (pack.add.coffee || 0);
        }
      }
    }
    draft.cart = [];
  });
};

export const removeCartEntry = (state: GameState, id: string, kind: CartEntry['kind']) =>
  produce(state, (draft) => {
    draft.cart = (draft.cart || []).reduce<CartEntry[]>((acc, entry) => {
      if (entry.id === id && entry.kind === kind) {
        if (entry.qty > 1) acc.push({ ...entry, qty: entry.qty - 1 });
      } else {
        acc.push(entry);
      }
      return acc;
    }, []);
  });

export const formatResources = (state: GameState) => ({
  grams: fmtNumber(state.grams),
  cash: fmtNumber(state.cash),
  perSec: fmtNumber(computePerSec(state)),
  level: state.level,
  xp: state.xp,
  xpNeed: xpForNext(state.level || 1)
});

export const DRYING_TIME = DRYING_TIME_SEC;
export const CURING_TIME = CURING_TIME_SEC;
export const DRY_WEIGHT_MULTIPLIER = DRY_WEIGHT_MULT;
export const DRY_PRICE_MULTIPLIER = DRY_PRICE_MULT;
export const WATER_COST_PER_USE = WATER_COST;

export { SAVE_KEY };

// --- Upgrades / Estate / Research / Staff / Breeding ---

export const upgradeCost = (state: GameState, id: string) => {
  const up = GLOBAL_UPGRADES.find((u) => u.id === id);
  if (!up) return 0;
  const lvl = state.upgrades[id] || 0;
  return Math.round(up.baseCost * Math.pow(1.6, lvl));
};

export const buyUpgrade = (state: GameState, id: string) => {
  const cost = upgradeCost(state, id);
  if (cost <= 0) return state;
  const payWithCash = state.cash >= cost;
  const payWithGrams = state.grams >= cost;
  if (!payWithCash && !payWithGrams) return state;
  return produce(state, (draft) => {
    if (payWithCash) draft.cash -= cost;
    else draft.grams -= cost;
    draft.upgrades[id] = (draft.upgrades[id] || 0) + 1;
  });
};

export const buyEstate = (state: GameState, id: string) => {
  const idx = GROW_ROOMS.findIndex((x) => x.id === id);
  if (idx === -1) return state;
  if ((state.growTierIndex || 0) >= idx) return state;
  const room = GROW_ROOMS[idx];
  if (state.cash < room.cost) return state;
  return produce(state, (draft) => {
    draft.cash -= room.cost;
    draft.growTierIndex = idx;
    draft.slotsUnlocked = Math.min(draft.slotsUnlocked || 0, room.slots);
  });
};

export const sellEstate = (state: GameState, id: string) => {
  const idx = GROW_ROOMS.findIndex((x) => x.id === id);
  if (idx === -1 || state.growTierIndex !== idx || idx === 0) return state;
  const room = GROW_ROOMS[idx];
  const refund = Math.round(room.cost * 0.6);
  return produce(state, (draft) => {
    draft.cash += refund;
    draft.growTierIndex = Math.max(0, idx - 1);
    draft.slotsUnlocked = Math.min(draft.slotsUnlocked, currentMaxSlots(draft as any));
  });
};

export const hireEmployee = (state: GameState, id: string) => {
  const emp = EMPLOYEES.find((e) => e.id === id);
  if (!emp) return state;
  if (state.employees[id]) return state;
  if (state.level < emp.reqLevel) return state;
  if (state.cash < emp.salary) return state;
  return produce(state, (draft) => {
    draft.cash -= emp.salary;
    draft.employees[id] = { hired: true, level: 1, energy: 100, resting: false };
  });
};

export const upgradeEmployee = (state: GameState, id: string) => {
  const emp = EMPLOYEES.find((e) => e.id === id);
  if (!emp || !state.employees[id]) return state;
  const level = state.employees[id].level || 1;
  const cost = Math.round(emp.salary * level * 2);
  if (state.grams < cost) return state;
  return produce(state, (draft) => {
    draft.grams -= cost;
    draft.employees[id].level = level + 1;
  });
};

export const fireEmployee = (state: GameState, id: string) =>
  produce(state, (draft) => {
    delete draft.employees[id];
  });

export const setEmployeeResting = (state: GameState, id: string, resting: boolean) => {
  if (!state.employees[id]) return state;
  return produce(state, (draft) => {
    if (draft.employees[id]) {
      draft.employees[id].resting = resting;
    }
  });
};

const employeeEnergyCost = (level: number) => Math.max(4, 8 - level);

const tryHarvestDraft = (draft: GameState, plant: Plant) => {
  if (plant.growProg < 1) return false;
  if ((draft.itemsOwned?.['shears'] || 0) <= 0) return false; // mindestens eine Schere vorhanden
  const qm = qualityMultiplier(draft, plant);
  const mastery = masteryForStrain(draft, plant.strainId);
  const qBonus = mastery.level >= 10 && Math.random() < 0.15 ? qm * 2 : qm;
  const gain = harvestYieldFor(draft, plant) * qm;
  const dryEstimate = gain * DRY_WEIGHT_MULT;
  addMasteryXp(draft as any, plant.strainId, 10);
  const proc = ensureProcessing(draft);
  proc.wet.push({ id: uid(), strainId: plant.strainId, grams: gain, quality: qBonus, stage: 'wet', createdAt: Date.now() });
  fillDryingSlots(proc);
  draft.plants = draft.plants.filter((p) => p.slot !== plant.slot);
  const tierBonus = qm >= 1.3 ? 1.5 : qm >= 1.1 ? 1.2 : 1;
  addXP(draft as any, Math.max(1, Math.floor((dryEstimate / 50) * tierBonus)));
  return true;
};

const tryWaterDraft = (draft: GameState, plant: Plant) => {
  if (plant.water >= WATER_MAX * 0.6) return false;
  if ((draft.cash || 0) < WATER_COST) return false;
  draft.cash = Math.max(0, (draft.cash || 0) - WATER_COST);
  plant.water = Math.min(WATER_MAX, (plant.water || 0) + WATER_ADD_AMOUNT);
  return true;
};

const tryFeedDraft = (draft: GameState, plant: Plant) => {
  ensureConsumables(draft);
  if (plant.nutrients >= NUTRIENT_MAX * 0.6) return false;
  if ((draft.consumables?.nutrient || 0) <= 0) return false;
  draft.consumables.nutrient -= 1;
  plant.nutrients = Math.min(NUTRIENT_MAX, (plant.nutrients || 0) + NUTRIENT_ADD_AMOUNT);
  plant.quality = clamp((plant.quality || 1) + 0.04, 0.4, 1.5);
  if (draft.consumables.pgr && draft.consumables.pgr > 0) {
    draft.consumables.pgr -= 1;
    plant.pgrBoostSec = (plant.pgrBoostSec || 0) + PGR_BOOST_SEC;
  }
  return true;
};

const pickSeedId = (draft: GameState) => {
  const seeds = draft.seeds || {};
  const favorites = draft.favorites || [];
  const fav = favorites.find((id) => (seeds[id] || 0) > 0);
  if (fav) return fav;
  let best: string | null = null;
  let bestCount = 0;
  for (const key of Object.keys(seeds)) {
    const qty = seeds[key] || 0;
    if (qty > bestCount) {
      best = key;
      bestCount = qty;
    }
  }
  return best;
};

const emptySlots = (draft: GameState) => {
  const used = new Set((draft.plants || []).map((p) => p.slot));
  const max = draft.slotsUnlocked || 0;
  const res: number[] = [];
  for (let i = 0; i < max; i++) {
    if (!used.has(i)) res.push(i);
  }
  return res;
};

const tryPlantDraft = (draft: GameState, slot: number, strainId: string) => {
  if (!strainId) return false;
  if ((draft.seeds?.[strainId] || 0) <= 0) return false;
  draft.seeds[strainId] = Math.max(0, (draft.seeds[strainId] || 0) - 1);
  draft.plants.push(createPlant(strainId, slot));
  return true;
};

const runGrowHelper = (draft: GameState, maxActions: number) => {
  draft.itemsOwned = draft.itemsOwned || {};
  let remaining = maxActions;
  let done = 0;
  const ready = draft.plants.filter((p) => p.growProg >= 1 && p.health > 0 && (draft.itemsOwned?.['shears'] || 0) > 0);
  for (const plant of ready) {
    if (remaining <= 0) break;
    if (tryHarvestDraft(draft, plant)) {
      remaining--;
      done++;
    }
  }
  if (remaining <= 0) return done;
  const careList = [...draft.plants]
    .filter((p) => p.health > 0)
    .sort((a, b) => (a.water + a.nutrients) - (b.water + b.nutrients));
  for (const plant of careList) {
    if (remaining <= 0) break;
    if (plant.water < WATER_MAX * 0.4 && tryWaterDraft(draft, plant)) {
      remaining--;
      done++;
    }
    if (remaining <= 0) break;
    if (plant.nutrients < NUTRIENT_MAX * 0.4 && tryFeedDraft(draft, plant)) {
      remaining--;
      done++;
    }
  }
  if (remaining <= 0) return done;
  const empties = emptySlots(draft);
  const seedId = pickSeedId(draft);
  for (const slot of empties) {
    if (remaining <= 0) break;
    if (seedId && tryPlantDraft(draft, slot, seedId)) {
      remaining--;
      done++;
    }
  }
  return done;
};

const employeeActions = (state: GameState, dt: number) => {
  const timer = (state._empTimer || 0) + dt;
  if (timer < 5) {
    return produce(state, (draft) => {
      draft._empTimer = timer;
    });
  }
  return produce(state, (draft) => {
    draft._empTimer = 0;
    const breakroomLevel = draft.upgrades?.['breakroom'] || 0;
    ensureConsumables(draft);
    for (const emp of EMPLOYEES) {
      const data = draft.employees[emp.id];
      if (!data) continue;
      data.energy = typeof data.energy === 'number' ? data.energy : 100;
      const level = data.level || 1;
      const costPerAction = employeeEnergyCost(level);

      if (data.resting) {
        if ((draft.consumables.coffee || 0) > 0) {
          draft.consumables.coffee -= 1;
          data.energy = 100;
          data.resting = false;
          continue;
        }
        const regen = 6 * (1 + 0.5 * breakroomLevel);
        data.energy = Math.min(100, data.energy + regen);
        if (data.energy >= 80) data.resting = false;
        continue;
      }

      if (emp.id === 'growhelper') {
        const maxByEnergy = Math.max(0, Math.floor(data.energy / costPerAction));
        const allowance = Math.min(emp.capacity || 1, maxByEnergy);
        if (allowance <= 0) {
          data.resting = true;
          continue;
        }
        const worked = runGrowHelper(draft as any, allowance);
        data.energy = Math.max(0, data.energy - worked * costPerAction);
        if (data.energy <= 5) data.resting = true;
        continue;
      }

      for (const task of emp.tasks) {
        if (data.energy <= 0) {
          data.resting = true;
          break;
        }
        const didWork = performEmployeeTask(draft as any, task);
        if (didWork) {
          data.energy = Math.max(0, data.energy - costPerAction);
        }
        if (data.energy <= 5) {
          data.resting = true;
          break;
        }
      }
    }
  });
};

const performEmployeeTask = (state: GameState, task: string) => {
  const plants = state.plants.filter((p) => p.health > 0);
  if (plants.length === 0) return false;
  const plant = plants[Math.floor(Math.random() * plants.length)];
  const slot = plant.slot;
  let empLevel = 1;
  for (const emp of EMPLOYEES) {
    if (emp.tasks.includes(task) && state.employees[emp.id]) {
      empLevel = (state.employees[emp.id] as any).level || 1;
      break;
    }
  }
  const efficiency = 1 + (empLevel - 1) * 0.1;
  if (task === 'water') {
    if (plant.water < WATER_MAX * 0.5 && (state.cash || 0) >= WATER_COST) {
      state.cash = Math.max(0, (state.cash || 0) - WATER_COST);
      plant.water = Math.min(WATER_MAX, plant.water + WATER_ADD_AMOUNT * 0.5 * efficiency);
      return true;
    }
  } else if (task === 'feed') {
    ensureConsumables(state);
    if (plant.nutrients < NUTRIENT_MAX * 0.5 && state.consumables.nutrient > 0) {
      state.consumables.nutrient -= 1;
      plant.nutrients = Math.min(NUTRIENT_MAX, plant.nutrients + NUTRIENT_ADD_AMOUNT * efficiency);
      plant.quality = clamp(plant.quality + 0.02 * efficiency, 0.4, 1.5);
      return true;
    }
  } else if (task === 'harvest') {
    if (plant.growProg >= 1 && (state.itemsOwned['shears'] || 0) > 0) {
      const gain = harvestYieldFor(state, plant) * qualityMultiplier(state, plant);
      state.grams += gain;
      state.totalEarned += gain;
      const q = qualityMultiplier(state, plant);
      state.qualityPool.grams = (state.qualityPool.grams || 0) + gain;
      state.qualityPool.weighted = (state.qualityPool.weighted || 0) + gain * q;
      state.plants = state.plants.filter((p) => p.slot !== slot);
      return true;
    }
  } else if (task === 'treat') {
    ensureConsumables(state);
    if (plant.pest && state.consumables.spray > 0) {
      state.consumables.spray -= 1;
      plant.pest = null;
      return true;
    }
  }
  return false;
};

const calculateHybridProfile = (p1: Strain, p2: Strain, randomFn = Math.random) => {
  const idx1 = strainRarityIndex(p1);
  const idx2 = strainRarityIndex(p2);
  const maxIdx = Math.max(idx1, idx2);
  let newIdx = maxIdx;
  if (idx1 === idx2 && idx1 < CASE_RARITIES.length - 1) {
    const upgradeChance = Math.min(0.5, 0.18 + idx1 * 0.08);
    if (randomFn() < upgradeChance) newIdx = idx1 + 1;
  } else if (Math.abs(idx1 - idx2) <= 1 && maxIdx < CASE_RARITIES.length - 1) {
    const chance = Math.min(0.35, 0.08 + Math.min(idx1, idx2) * 0.05);
    if (randomFn() < chance) newIdx = maxIdx + 1;
  }
  newIdx = Math.min(newIdx, CASE_RARITIES.length - 1);
  const newRarity = CASE_RARITIES[newIdx];
  const baseGeneration = Math.max(Number(p1.generation || 0), Number(p2.generation || 0));
  const generation = baseGeneration + 1;
  const genLabel = generation === 1 ? 'Hybrid' : generation === 2 ? 'Ultra Hybrid' : generation === 3 ? 'Supra Hybrid' : generation === 4 ? 'Mythic Hybrid' : `Omega Hybrid Gen ${generation}`;
  const name = `${genLabel}: ${p1.name} x ${p2.name}`;
  const baseCost = (p1.cost + p2.cost) / 2;
  const baseYield = (p1.yield + p2.yield) / 2;
  const baseGrow = (p1.grow + p2.grow) / 2;
  const baseQuality = (p1.quality + p2.quality) / 2;
  const baseYieldBonus = (p1.yieldBonus || 0 + (p2.yieldBonus || 0)) / 2;
  const baseOfferBonus = (p1.offerBonus || 0 + (p2.offerBonus || 0)) / 2;
  const yieldRoll = randomFn();
  const yieldBoost = clamp(0.6 + yieldRoll * 2.4 + newIdx * 0.08, 0.45, 3.5);
  const newYield = Math.max(40, Math.round(baseYield * yieldBoost));
  const growRoll = randomFn();
  const growthModifier = clamp(0.75 + (1.4 - Math.min(yieldBoost, 3)) * 0.25 + (0.2 - growRoll * 0.4) - newIdx * 0.05, 0.45, 1.4);
  const newGrow = Math.max(60, Math.round(baseGrow * growthModifier));
  const qualityRoll = randomFn();
  const newQuality = clamp(Number((baseQuality + (qualityRoll - 0.5) * 0.35 + newIdx * 0.07).toFixed(2)), 0.85, 2.4);
  const bonusRoll = randomFn();
  const newYieldBonus = Number((baseYieldBonus + 0.04 + bonusRoll * 0.12 + newIdx * 0.03).toFixed(2));
  const newOfferBonus = Number((baseOfferBonus + 0.04 + (1 - bonusRoll) * 0.12 + newIdx * 0.03).toFixed(2));
  return {
    id: `hybrid_${p1.id}_${p2.id}_${Date.now()}`,
    name,
    tag: (p1.tag || 'H1') + (p2.tag || 'H2'),
    rarity: newRarity,
    cost: Math.round(baseCost * (1 + newIdx * 0.2)),
    yield: newYield,
    grow: newGrow,
    quality: newQuality,
    yieldBonus: newYieldBonus,
    offerBonus: newOfferBonus,
    desc: `Hybrid aus ${p1.name} und ${p2.name}`,
    generation
  } as Strain;
};

export const setBreedingParent = (state: GameState, parent: 1 | 2, strainId: string | null) =>
  produce(state, (draft) => {
    draft.breedingSlots = draft.breedingSlots || { parent1: null, parent2: null };
    draft.breedingSlots[parent === 1 ? 'parent1' : 'parent2'] = strainId;
  });

export const performBreeding = (state: GameState) => {
  const slots = state.breedingSlots || { parent1: null, parent2: null };
  const p1Id = slots.parent1;
  const p2Id = slots.parent2;
  if (!p1Id || !p2Id || p1Id === p2Id) return state;
  if ((state.seeds[p1Id] || 0) <= 0 || (state.seeds[p2Id] || 0) <= 0) return state;
  const s1 = getStrain(state, p1Id);
  const s2 = getStrain(state, p2Id);
  const hybrid = calculateHybridProfile(s1, s2);
  if (!hybrid) return state;
  return produce(state, (draft) => {
    draft.seeds[p1Id] = Math.max(0, (draft.seeds[p1Id] || 0) - 1);
    draft.seeds[p2Id] = Math.max(0, (draft.seeds[p2Id] || 0) - 1);
    draft.customStrains.push(hybrid);
    draft.seeds[hybrid.id] = (draft.seeds[hybrid.id] || 0) + 1;
    draft.breedingSlots = { parent1: null, parent2: null };
  });
};

export const buyContract = (state: GameState, id: string) => {
  const contract = APOTHEKEN_VERTRAEGE.find((v) => v.id === id);
  if (!contract) return state;
  if (state.apothekenVertraege[id]) return state;
  if (state.cash < contract.costToHire || state.level < contract.reqLevel) return state;
  return produce(state, (draft) => {
    draft.cash -= contract.costToHire;
    draft.apothekenVertraege[id] = true;
  });
};

export const fireContract = (state: GameState, id: string) =>
  produce(state, (draft) => {
    delete draft.apothekenVertraege[id];
  });

export const questConditions = (state: GameState) => {
  const hasJob = !!state.jobId;
  const hasSeed = Object.values(state.seeds || {}).some((v) => v > 0);
  const hasShears = (state.itemsOwned?.['shears'] || 0) > 0;
  const hasNutrient = (state.consumables?.nutrient || 0) > 0;
  const hasFungicide = (state.consumables?.fungicide || 0) > 0;
  const hasSpray = (state.consumables?.spray || 0) > 0;
  const hasPlant = Array.isArray(state.plants) && state.plants.length > 0;
  const timeRunning = getTimeSpeed(state) > 0;
  return { hasJob, hasSeed, hasShears, hasNutrient, hasFungicide, hasSpray, hasPlant, timeRunning };
};

export const advanceQuest = (state: GameState) => {
  const conditions = questConditions(state);
  let step = state.questStep || 0;
  if (step === 0 && conditions.hasJob) step = 1;
  if (step === 1 && conditions.hasSeed && conditions.hasShears && conditions.hasNutrient && conditions.hasFungicide && conditions.hasSpray) step = 2;
  if (step === 2 && conditions.hasPlant && conditions.timeRunning) step = 3;
  if (step !== state.questStep) {
    return produce(state, (draft) => {
      draft.questStep = step;
      const text =
        step === 1
          ? 'Quest 1 abgeschlossen: Job gefunden.'
          : step === 2
          ? 'Quest 2 abgeschlossen: Grundausstattung gekauft.'
          : step >= 3
          ? 'Starter-Quests erledigt. Viel Erfolg!'
          : '';
      if (text) {
        const id = draft.nextMsgId || 1;
        draft.nextMsgId = id + 1;
        draft.messages.push({ id, text, type: 'quest', createdAt: Date.now(), unread: true });
        draft.unreadMessages = (draft.unreadMessages || 0) + 1;
      }
    });
  }
  return state;
};
