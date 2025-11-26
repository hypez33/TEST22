import { produce } from 'immer';
import {
  APOTHEKEN_VERTRAEGE,
  CONSUMABLE_PACKS,
  DAYS_PER_YEAR,
  GAME_DAY_REAL_SECONDS,
  GROW_ROOMS,
  ITEMS,
  JOBS,
  PEST_GLOBAL_RATE,
  SAVE_KEY,
  STRAINS,
  RESEARCH_TREE,
  buildCaseConfigs
} from './data';
import { QUESTS } from './quests';
import {
  CartEntry,
  CaseStats,
  GameState,
  Plant,
  QuestProgress
} from './types';
import { ACHIEVEMENTS } from './achievements';
import { clamp, defaultCaseStats, fmtNumber } from './utils';

// --- MODULE IMPORTS ---
import {
  advanceProcessing,
  startDrying,
  startCuring,
  collectProcessed,
  collectAllProcessed,
  pressRosin,
  ensureProcessing,
  fillDryingSlots,
  DRYING_TIME,
  CURING_TIME,
  DRY_WEIGHT_MULTIPLIER,
  DRY_PRICE_MULTIPLIER
} from './logic/processing';

import {
  marketDrift,
  maybeApplyRandomNews,
  getSalePricePerGram,
  sellGrams,
  sellToBuyer,
  acceptOffer,
  declineOffer,
  spawnOffer,
  spawnOrder,
  deliverOrder,
  declineOrder,
  spawnApothekenOffer,
  deliverApotheke,
  spawnMarketEvent,
  triggerMarketEvent,
  currentMaxOffersForState,
  currentSpawnWindowForState
} from './logic/market';

import {
  buyEstate,
  sellEstate,
  hireEmployee,
  upgradeEmployee,
  fireEmployee,
  setEmployeeResting,
  employeeActions
} from './logic/employees';

import {
  advancePlant,
  createPlant,
  ensurePlantDefaults,
  harvestPlant,
  harvestPlantWithBonus,
  harvestAllReady,
  waterPlant,
  feedPlant,
  feedPlantWithBonus,
  treatPlant,
  bulkWater,
  bulkFeed,
  quickBuyApply,
  plantSeed,
  removePlant,
  upgradePlant,
  unlockSlot,
  buySeed,
  growTimeFor,
  harvestYieldFor,
  harvestYieldDetails,
  qualityMultiplier,
  statusForPlant,
  timerForPlant,
  computePerSec,
  getAllStrains,
  getStrain,
  ensureConsumables,
  WATER_COST_PER_USE
} from './logic/plants';

import {
  performBreeding as performBreedingGenetics,
  setBreedingParent as setBreedingParentGenetics,
  calculateHybridProfile,
  getTraitMultiplier,
  dismissBreedingResult
} from './logic/genetics';

import {
  researchEffects,
  itemCost,
  seedCost,
  upgradeCost,
  slotUnlockCost,
  xpForNext,
  masteryLevelFor,
  currentMaxSlots,
  currentGrowRoom,
  clampYield
} from './logic/shared';

// --- RE-EXPORTS FOR UI ---
export {
  // Plants
  advancePlant, createPlant, ensurePlantDefaults, harvestPlant, harvestPlantWithBonus, harvestAllReady,
  waterPlant, feedPlant, feedPlantWithBonus, treatPlant, bulkWater, bulkFeed, quickBuyApply,
  plantSeed, removePlant, upgradePlant, unlockSlot, buySeed, growTimeFor, harvestYieldFor,
  harvestYieldDetails, qualityMultiplier, statusForPlant, timerForPlant, computePerSec,
  getAllStrains, getStrain, ensureConsumables, WATER_COST_PER_USE,
  // Market
  marketDrift, getSalePricePerGram, sellGrams, sellToBuyer, acceptOffer, declineOffer,
  spawnOffer, spawnOrder, deliverOrder, declineOrder, spawnApothekenOffer, deliverApotheke,
  // Processing
  startDrying, startCuring, collectProcessed, collectAllProcessed, pressRosin,
  DRYING_TIME, CURING_TIME, DRY_WEIGHT_MULTIPLIER, DRY_PRICE_MULTIPLIER,
  // Employees & Estate
  buyEstate, sellEstate, hireEmployee, upgradeEmployee, fireEmployee, setEmployeeResting,
  // Shared / Getters
  researchEffects, itemCost, seedCost, upgradeCost, slotUnlockCost, xpForNext,
  masteryLevelFor, currentMaxSlots, currentGrowRoom, clampYield,
  // Genetics
  calculateHybridProfile, getTraitMultiplier, performBreedingGenetics as performBreeding, setBreedingParentGenetics as setBreedingParent, dismissBreedingResult
};

export { SAVE_KEY };

// --- ENGINE CONSTANTS & STATE ---
export const SPEED_OPTIONS = [0, 0.5, 1, 2, 7];
const SAVE_VERSION = 2;

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
  highContrast: true,
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
    if (typeof draft.highContrast !== 'boolean') draft.highContrast = true;
    // Ensure Sub-States
    draft.research = draft.research || {};
    draft.qualityPool = draft.qualityPool || { grams: 0, weighted: 0 };
    draft.caseInventory = draft.caseInventory || {};
    draft.employees = draft.employees || {};
    
    // Migration Logic here if needed
    draft.saveVersion = SAVE_VERSION;
  });
};

// --- HELPERS & UI UTILS (Restored Locally) ---

export const formatResources = (state: GameState) => ({
  grams: fmtNumber(state.grams),
  cash: fmtNumber(state.cash),
  perSec: fmtNumber(computePerSec(state)),
  level: state.level,
  xp: state.xp,
  xpNeed: xpForNext(state.level || 1)
});

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

// --- ORCHESTRATOR ---

const getTimeSpeed = (state: GameState) => {
  const t = Number(state.timeSpeed);
  return SPEED_OPTIONS.includes(t) ? t : 0;
};

export const tickState = (state: GameState, realSeconds: number): GameState => {
  const speed = getTimeSpeed(state);
  const worldDt = Math.max(0, realSeconds * speed);
  
  let next = produce(state, (draft) => {
    draft.playtimeSec += Math.max(0, realSeconds);
    draft.lastTime = Date.now();
    syncQuests(draft as any);
    draft._achTimer = (draft._achTimer || 0) + realSeconds;

    if (worldDt > 0) {
      // 1. Plants
      draft.plants.forEach((p) => advancePlant(draft as any, p, worldDt));
      
      // 2. Processing
      advanceProcessing(draft as any, worldDt);
      
      // 3. Market & Events
      marketDrift(draft as any, worldDt);
      maybeApplyRandomNews(draft as any, worldDt, pushMessage as any);
      
      // 4. Employees
      employeeActions(draft as any, worldDt);
      
      // 5. Game Time
      const prevTotal = draft.gameDaysTotal || 0;
      draft.gameDaysTotal = (draft.gameDaysTotal || 0) + worldDt / GAME_DAY_REAL_SECONDS;
      // ... (hier könnte noch Jahr/Monat Abrechnung stehen, falls nicht ausgelagert) ...
    }

    // Offers / Spawns (Orchestration)
    draft.nextOfferIn = Math.max(0, (draft.nextOfferIn || 0) - worldDt);
    if (draft.nextOfferIn === 0 && (draft.offers?.length || 0) < currentMaxOffersForState(draft as any)) {
      spawnOffer(draft as any);
      const [min, max] = currentSpawnWindowForState(draft as any);
      draft.nextOfferIn = min + Math.random() * (max - min);
    }
    // ... Apotheken Offers etc ...
    draft.nextApothekenOfferIn = Math.max(0, (draft.nextApothekenOfferIn || 0) - worldDt);
    if (draft.nextApothekenOfferIn === 0) {
        spawnApothekenOffer(draft as any);
        draft.nextApothekenOfferIn = 60; 
    }
    
    const perSec = computePerSec(draft as any);
    draft.bestPerSec = Math.max(draft.bestPerSec, perSec);
  });

  // Quest & Achievement Checks (alle paar Sekunden)
  if ((next._achTimer || 0) >= 5) {
    next = produce(next, (draft) => {
      draft._achTimer = 0;
      checkAchievements(draft as any);
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

// --- RESTORED ACTIONS (SHOP, JOBS, BREEDING) ---

// 1. CART / SHOP
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
    const name = entry.name || (entry.kind === 'seed' ? getStrain(draft as any, entry.id).name : entry.kind === 'item' ? ITEMS.find((i) => i.id === entry.id)?.name : CONSUMABLE_PACKS.find((p) => p.id === entry.id)?.name);
    const existing = draft.cart.find((c) => c.id === entry.id && c.kind === entry.kind);
    if (existing) {
      existing.qty += entry.qty;
      existing.price = price;
      if (name) existing.name = name;
    } else {
      draft.cart.push({ ...entry, price, name });
    }
  });

export const clearCart = (state: GameState) => produce(state, (draft) => { draft.cart = []; });

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
        if (pack) {
          draft.consumables.nutrient += (pack.add.nutrient || 0) * entry.qty;
          draft.consumables.spray += (pack.add.spray || 0) * entry.qty;
          draft.consumables.fungicide = (draft.consumables.fungicide || 0) + (pack.add.fungicide || 0) * entry.qty;
          draft.consumables.beneficials = (draft.consumables.beneficials || 0) + (pack.add.beneficials || 0) * entry.qty;
        }
      }
    }
    draft.cart = [];
  });
};

export const buyItem = (state: GameState, itemId: string) => {
  const item = ITEMS.find((i) => i.id === itemId);
  if (!item) return state;
  const cost = itemCost(state, itemId);
  if (state.cash < cost) return state;
  return produce(state, (draft) => {
    draft.cash -= cost;
    draft.itemsOwned[itemId] = (draft.itemsOwned[itemId] || 0) + 1;
  });
};

export const buyConsumablePack = (state: GameState, packId: string) => {
  const pack = CONSUMABLE_PACKS.find((p) => p.id === packId);
  if (!pack) return state;
  if (state.cash < pack.price) return state;
  return produce(state, (draft) => {
    draft.cash -= pack.price;
    ensureConsumables(draft);
    draft.consumables.nutrient += pack.add.nutrient || 0;
    draft.consumables.water += pack.add.water || 0;
    draft.consumables.spray += pack.add.spray || 0;
    draft.consumables.fungicide += pack.add.fungicide || 0;
    draft.consumables.beneficials += pack.add.beneficials || 0;
  });
};

// 2. RESEARCH
const findResearchNode = (nodeId: string) => {
  for (const branch of Object.values(RESEARCH_TREE)) {
    if (branch.nodes[nodeId]) return branch.nodes[nodeId];
  }
  return null;
};

const researchCostSpent = (state: GameState) => {
  const owned = state.research || {};
  let spent = 0;
  for (const branch of Object.values(RESEARCH_TREE)) {
    for (const [id, node] of Object.entries(branch.nodes)) {
      if (owned[id]) spent += node.cost || 0;
    }
  }
  return spent;
};

export const researchAvailable = (state: GameState) => {
  const earned = state.hazePoints || 0;
  const spent = researchCostSpent(state);
  return Math.max(0, earned - spent);
};

export const buyResearchNode = (state: GameState, nodeId: string) =>
  produce(state, (draft) => {
    const node = findResearchNode(nodeId);
    if (!node) return;
    draft.research = draft.research || {};
    if (draft.research[nodeId]) return;
    const reqs = node.requires || [];
    if (reqs.some((req) => !draft.research[req])) return;
    if (researchAvailable(draft as any) < node.cost) return;
    draft.research[nodeId] = true;
  });

// 3. PRESTIGE / UPGRADES (Simple)
export const calcPrestigeGain = (totalEarned: number) => Math.floor(Math.pow(Math.max(0, totalEarned) / 10000, 0.5));

export const buyUpgrade = (state: GameState, id: string) => {
  const cost = upgradeCost(state, id);
  if (cost <= 0) return state;
  const payWithCash = state.cash >= cost;
  const payWithGrams = state.grams >= cost;
  if (!payWithCash && !payWithGrams) return state;
  return produce(state, (draft) => {
    if (payWithCash) draft.cash -= cost; else draft.grams -= cost;
    draft.upgrades[id] = (draft.upgrades[id] || 0) + 1;
  });
};

export const doPrestige = (state: GameState) => {
  const gain = calcPrestigeGain(state.totalEarned);
  if (gain <= 0) return state;
  const theme = state.theme;
  return produce(createInitialState(), (draft) => {
    draft.hazePoints = state.hazePoints + gain;
    draft.resets = (state.resets || 0) + 1;
    draft.theme = theme;
    draft.welcomeRewarded = true;
  });
};

// 3. JOBS & CONTRACTS
export const applyForJob = (state: GameState, jobId: string) => {
  const job = JOBS.find((j) => j.id === jobId);
  if (!job) return state;
  if ((state.level || 1) < job.reqLevel) return state;
  return produce(state, (draft) => {
    const days = draft.gameDaysTotal || 0;
    draft.applications = draft.applications || [];
    draft.applications.push({ jobId, decideAt: days + 3 });
    pushMessage(draft as any, `Bewerbung bei ${job.name} eingereicht.`, 'info');
  });
};

export const takeJob = (state: GameState, jobId: string) => produce(state, (draft) => { draft.jobId = jobId; });
export const fireJob = (state: GameState) => produce(state, (draft) => { draft.jobId = null; });

export const buyContract = (state: GameState, id: string) => {
  const contract = APOTHEKEN_VERTRAEGE.find((v) => v.id === id);
  if (!contract || state.cash < contract.costToHire) return state;
  return produce(state, (draft) => {
    draft.cash -= contract.costToHire;
    draft.apothekenVertraege[id] = true;
  });
};
export const fireContract = (state: GameState, id: string) => produce(state, (draft) => { delete draft.apothekenVertraege[id]; });

const processApplications = (state: GameState) => {
  const days = state.gameDaysTotal || 0;
  const pending: any[] = [];
  for (const app of state.applications || []) {
    if (days >= (app as any).decideAt) {
      const job = JOBS.find((j) => j.id === app.jobId);
      if (!job) continue;
      if (Math.random() < 0.5) {
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

// 4. BREEDING & CASES

export const openCase = (state: GameState, caseId: string, fast = false) => {
  const configs = buildCaseConfigs(getAllStrains(state));
  const cfg = configs.find((c) => c.id === caseId);
  if (!cfg || state.cash < cfg.price) return state;
  return produce(state, (draft) => {
    draft.cash -= cfg.price;
    // Simple Loot Logic
    const loot = (cfg.lootBuilder as any)();
    if (loot && loot.length) {
        const winner = loot[0]; // Simplified
        draft.seeds[winner.strainId] = (draft.seeds[winner.strainId] || 0) + 1;
        draft.caseInventory[winner.strainId] = (draft.caseInventory[winner.strainId] || 0) + 1;
    }
    draft.caseStats = draft.caseStats || defaultCaseStats();
    draft.caseStats.opened += 1;
  });
};

// 5. UTILS
export const toggleTheme = (state: GameState, theme: 'light' | 'dark') => produce(state, (draft) => { draft.theme = theme; });
export const setBulkConserve = (state: GameState, on: boolean) => produce(state, (draft) => { draft.bulkConserve = on; });
export const toggleDisplayPrefs = (state: GameState, prefs: { compact?: boolean; contrast?: boolean }) =>
  produce(state, (draft) => {
    if (typeof prefs.compact === 'boolean') draft.compactMode = prefs.compact;
    if (typeof prefs.contrast === 'boolean') draft.highContrast = prefs.contrast;
  });
export const setSpeed = (state: GameState, speed: number) => produce(state, (draft) => { draft.timeSpeed = speed; });
export const setDifficulty = (state: GameState, diff: any) => produce(state, (draft) => { draft.difficulty = diff; });
export const setInventoryFilters = (state: GameState, f: string, s: string) => produce(state, (draft) => { draft.inventoryFilter = f; draft.inventorySort = s; });
export const setAutoGrow = (state: GameState, id: string, on: boolean) => produce(state, (draft) => { draft.autoGrow = draft.autoGrow || {}; draft.autoGrow[id] = on; });
export const toggleFavoriteStrain = (state: GameState, id: string) => produce(state, (draft) => { 
    draft.favorites = draft.favorites || [];
    if (draft.favorites.includes(id)) draft.favorites = draft.favorites.filter(x => x !== id);
    else draft.favorites.push(id);
});

const addXP = (state: GameState, amt: number) => {
  state.xp = (state.xp || 0) + amt;
  // Level up logic could go here
};

const syncQuests = (state: GameState) => {
  state.quests = state.quests || [];
  state.activeQuests = state.activeQuests || [];
  state.completedQuests = state.completedQuests || [];
};

const ensureQuestState = (state: GameState) => {
  state.quests = state.quests || [];
  state.activeQuests = state.activeQuests || [];
  state.completedQuests = state.completedQuests || [];
};

const checkAchievements = (state: GameState) => {
  state.unlockedAchievements = state.unlockedAchievements || [];
  for (const ach of ACHIEVEMENTS) {
    if (state.unlockedAchievements.includes(ach.id)) continue;
    if (ach.condition(state)) {
      state.unlockedAchievements.push(ach.id);
      if (ach.reward?.type === 'haze') state.hazePoints = (state.hazePoints || 0) + (ach.reward.amount || 0);
      pushMessage(state, `${ach.title} freigeschaltet`, 'success');
    }
  }
};

const advanceQuest = (state: GameState) => {
  return produce(state, (draft) => {
    ensureQuestState(draft);
    // Auto-unlock the next quest if none active and requirements met
    if (!draft.quests.length && QUESTS.length > 0) {
      const q = QUESTS[0];
      draft.quests.push({ id: q.id, tasks: q.tasks.map((t) => ({ ...t, current: t.current || 0 })), status: 'active' });
      draft.activeQuests.push(q.id);
    }
  });
};

export const checkQuestProgress = (state: GameState, action: string, payload?: any) =>
  produce(state, (draft) => {
    ensureQuestState(draft);
    for (const qp of draft.quests) {
      if (qp.status !== 'active') continue;
      const def = QUESTS.find((q) => q.id === qp.id);
      if (!def) continue;
      qp.tasks = qp.tasks.map((t) => ({ ...t, current: t.current || 0 }));
      for (const task of qp.tasks) {
        if (task.type !== action) continue;
        const amt = payload?.amount ?? 1;
        if (task.type === 'harvest') {
          if (task.target && payload?.strainId && payload.strainId !== task.target) continue;
          task.current = Math.min(task.amount, (task.current || 0) + amt);
        } else if (task.type === 'sell') {
          task.current = Math.min(task.amount, (task.current || 0) + (payload?.grams || amt));
        } else if (task.type === 'cash') {
          task.current = Math.min(task.amount, (task.current || 0) + (payload?.cash || 0));
        } else if (task.type === 'level') {
          task.current = Math.max(task.current || 0, payload?.level || draft.level || 0);
        }
      }
      const allDone = qp.tasks.every((t) => (t.current || 0) >= t.amount);
      if (allDone) qp.status = 'ready';
    }
  });

export const claimQuestReward = (state: GameState, id: string) =>
  produce(state, (draft) => {
    ensureQuestState(draft);
    const qp = draft.quests.find((q) => q.id === id);
    if (!qp || qp.status !== 'ready') return;
    const def = QUESTS.find((q) => q.id === id);
    if (!def) {
      qp.status = 'claimed';
      return;
    }
    for (const reward of def.rewards) {
      if (reward.cash) draft.cash += reward.cash;
      if (reward.xp) addXP(draft, reward.xp);
      if (reward.seed) draft.seeds[reward.seed] = (draft.seeds[reward.seed] || 0) + (reward.count || 1);
      if (reward.item) draft.itemsOwned[reward.item] = (draft.itemsOwned[reward.item] || 0) + (reward.count || 1);
      if (reward.consumable) {
        ensureConsumables(draft);
        draft.consumables[reward.consumable as keyof typeof draft.consumables] =
          (draft.consumables[reward.consumable as keyof typeof draft.consumables] as number) + (reward.count || 1);
      }
      if (reward.message) pushMessage(draft as any, reward.message, 'info');
    }
    qp.status = 'claimed';
    draft.completedQuests = draft.completedQuests || [];
    if (!draft.completedQuests.includes(id)) draft.completedQuests.push(id);
    draft.activeQuests = draft.activeQuests.filter((q) => q !== id);
  });
