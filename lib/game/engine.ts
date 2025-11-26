import {
  APOTHEKEN_VERTRAEGE,
  CASE_RARITIES,
  DAYS_PER_YEAR,
  GAME_DAY_REAL_SECONDS,
  RESEARCH_TREE,
  SAVE_KEY,
  STRAINS,
  POSSIBLE_TRAITS
} from './data';
import { CaseStats, CartEntry, GameState, Plant, QuestProgress, Rarity, Strain, StrainTrait } from './types';
import { QUESTS } from './quests';
import { ACHIEVEMENTS } from './achievements';
import { clamp, defaultCaseStats, fmtNumber } from './utils';
import {
  advanceProcessing,
  collectAllProcessed as collectAllProcessedProcessing,
  collectProcessed as collectProcessedProcessing,
  DRY_WEIGHT_MULT,
  ensureProcessing,
  fillDryingSlots,
  pressRosin as pressRosinProcessing,
  startCuring as startCuringProcessing,
  startDrying as startDryingProcessing
} from './logic/processing';
import {
  clampQualityValue,
  clampYield,
  currentGrowRoom,
  currentMaxSlots,
  globalMultiplier,
  itemCost,
  itemQualityMultiplier,
  masteryForStrain,
  pestRiskModifiers,
  researchEffects,
  seedCost,
  slotUnlockCost,
  traitMultiplier,
  traitSpeedMultiplier,
  upgradeCost,
  xpForNext
} from './logic/shared';
import {
  acceptOffer as acceptOfferMarket,
  declineOffer as declineOfferMarket,
  deliverApotheke as deliverApothekeMarket,
  deliverOrder as deliverOrderMarket,
  declineOrder as declineOrderMarket,
  getSalePricePerGram as getSalePricePerGramMarket,
  marketDrift as marketDriftLogic,
  maybeApplyRandomNews,
  sellGrams as sellGramsMarket,
  sellToBuyer as sellToBuyerMarket,
  spawnApothekenOffer as spawnApothekenOfferMarket,
  spawnMarketEvent as spawnMarketEventLogic,
  spawnOffer as spawnOfferMarket,
  spawnOrder as spawnOrderMarket,
  triggerMarketEvent as triggerMarketEventLogic,
  currentSpawnWindowForState,
  currentMaxOffersForState,
  cleanExpiredOffers
} from './logic/market';
import {
  advancePlant,
  bulkFeed as bulkFeedPlants,
  bulkWater as bulkWaterPlants,
  buySeed as buySeedPlant,
  computePerSec as computePerSecPlants,
  createPlant,
  ensureConsumables,
  ensurePlantDefaults,
  feedPlant as feedPlantPlants,
  feedPlantWithBonus as feedPlantWithBonusPlants,
  getAllStrains,
  getStrain,
  growTimeFor as growTimeForPlant,
  harvestAllReady as harvestAllReadyPlants,
  harvestPlant as harvestPlantPlants,
  harvestPlantWithBonus as harvestPlantWithBonusPlants,
  harvestYieldDetails as harvestYieldDetailsPlants,
  harvestYieldFor as harvestYieldForPlants,
  WATER_COST_PER_USE,
  plantSeed as plantSeedPlant,
  qualityMultiplier as qualityMultiplierPlants,
  removePlant as removePlantPlant,
  statusForPlant as statusForPlantPlants,
  timerForPlant as timerForPlantPlants,
  treatPlant as treatPlantPlants,
  unlockSlot as unlockSlotPlant,
  upgradePlant as upgradePlantPlants,
  waterPlant as waterPlantPlants,
  quickBuyApply as quickBuyApplyPlants,
  WATER_COST
} from './logic/plants';
const computePerSec = computePerSecPlants;
import {
  buyEstate as buyEstateLogic,
  sellEstate as sellEstateLogic,
  hireEmployee,
  upgradeEmployee,
  fireEmployee,
  setEmployeeResting,
  employeeActions as employeeActionsLogic
} from './logic/employees';
export { clampYield, currentGrowRoom, currentMaxSlots, itemCost, masteryLevelFor, researchEffects, seedCost, slotUnlockCost, upgradeCost, xpForNext } from './logic/shared';
export {
  ensureProcessing,
  fillDryingSlots,
  advanceProcessing,
  startDrying,
  startCuring,
  collectProcessed,
  collectAllProcessed,
  pressRosin
} from './logic/processing';
export {
  getSalePricePerGram,
  sellGrams,
  sellToBuyer,
  spawnOffer,
  acceptOffer,
  declineOffer,
  spawnApothekenOffer,
  deliverApotheke,
  spawnOrder,
  deliverOrder,
  declineOrder,
  spawnMarketEvent,
  triggerMarketEvent,
  marketDrift,
  maybeApplyRandomNews
} from './logic/market';
export { hireEmployee, upgradeEmployee, fireEmployee, setEmployeeResting } from './logic/employees';
export {
  createPlant,
  ensurePlantDefaults,
  growTimeFor,
  harvestYieldDetails,
  harvestYieldFor,
  qualityMultiplier,
  timerForPlant,
  statusForPlant,
  computePerSec,
  advancePlant,
  waterPlant,
  feedPlant,
  feedPlantWithBonus,
  treatPlant,
  bulkWater,
  bulkFeed,
  quickBuyApply,
  harvestPlant,
  harvestPlantWithBonus,
  harvestAllReady,
  removePlant,
  unlockSlot,
  plantSeed,
  buySeed,
  upgradePlant
} from './logic/plants';

export const SPEED_OPTIONS = [0, 0.5, 1, 2, 7];
const SAVE_VERSION = 2;
const uid = () => Math.random().toString(36).slice(2, 9);

const getTimeSpeed = (state: GameState) => {
  const t = Number(state.timeSpeed);
  return SPEED_OPTIONS.includes(t) ? t : 0;
};

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

const addMasteryXp = (state: GameState, strainId: string, xp: number) => {
  state.strainMastery = state.strainMastery || {};
  state.strainMastery[strainId] = (state.strainMastery[strainId] || 0) + xp;
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
    if (draft.employees) {
      draft.employees = { ...(draft.employees as any) }; // ensure writable copy
      if ((draft.employees as any).grower && !(draft.employees as any).growhelper) {
        (draft.employees as any).growhelper = { ...(draft.employees as any).grower };
        delete (draft.employees as any).grower;
      }
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

export const tickState = (state: GameState, realSeconds: number): GameState => {
  const speed = getTimeSpeed(state);
  const worldDt = Math.max(0, realSeconds * speed);

  let next = produce(state, (draft) => {
    draft.playtimeSec += Math.max(0, realSeconds);
    draft.lastTime = Date.now();
    draft._achTimer = (draft._achTimer || 0) + realSeconds;
    syncQuests(draft as any);

    if (worldDt <= 0) return;

    // Module ticks
    draft.plants.forEach((p) => advancePlant(draft as any, p, worldDt));
    advanceGameTime(draft as any, worldDt);
    advanceProcessing(draft as any, worldDt);
    marketDriftLogic(draft as any, worldDt);
    maybeApplyRandomNews(draft as any, worldDt, pushMessage as any);

    // Offer/Order/Apotheken timers & spawns
    draft.nextOfferIn = Math.max(0, (draft.nextOfferIn || 0) - worldDt);
    draft.nextApothekenOfferIn = Math.max(0, (draft.nextApothekenOfferIn || 0) - worldDt);
    draft.nextOrderIn = Math.max(0, (draft.nextOrderIn || 0) - worldDt);
    if (draft.nextOfferIn === 0 && (draft.offers?.length || 0) < currentMaxOffersForState(draft as any)) {
      spawnOfferMarket(draft as any);
      const [min, max] = currentSpawnWindowForState(draft as any);
      draft.nextOfferIn = min + Math.random() * (max - min);
    }
    if (draft.nextApothekenOfferIn === 0 && (draft.apothekenOffers?.length || 0) < currentMaxOffersForState(draft as any)) {
      spawnApothekenOfferMarket(draft as any);
      draft.nextApothekenOfferIn = Math.max(30, Math.random() * 60 + 30);
    }
    if (draft.nextOrderIn === 0 && (draft.orders?.length || 0) < 3) {
      spawnOrderMarket(draft as any);
      draft.nextOrderIn = 90 + Math.random() * 120;
    }
    cleanExpiredOffers(draft as any);
    processApplications(draft as any);

    // Random game events
    draft.nextGameEventIn = typeof draft.nextGameEventIn === 'number' ? draft.nextGameEventIn : 300;
    draft.nextGameEventIn = Math.max(0, (draft.nextGameEventIn || 0) - worldDt);
    if (draft.nextGameEventIn === 0) {
      spawnRandomEvent(draft as any);
      draft.nextGameEventIn = 300 + Math.random() * 600;
    }
    draft.activeEvents = (draft.activeEvents || [])
      .map((ev: any) => ({ ...ev, duration: Math.max(0, (ev.duration || 0) - worldDt) }))
      .filter((ev: any) => ev.duration > 0);
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
      draft.cash += Math.floor(Math.random() * 50) + 10;
    }

    // Market timers/events
    if (draft.marketTimer > 0) draft.marketTimer = Math.max(0, draft.marketTimer - worldDt);
    if (draft.nextMarketEventIn > 0) draft.nextMarketEventIn = Math.max(0, draft.nextMarketEventIn - worldDt);
    if (draft.nextMarketEventIn === 0 && draft.marketTimer === 0) spawnMarketEventLogic(draft as any);

    const perSec = computePerSec(draft as any);
    draft.bestPerSec = Math.max(draft.bestPerSec, perSec);
  });

  if (worldDt > 0) {
    next = employeeActionsLogic(next, worldDt, { addXP });
  }

  if ((next._achTimer || 0) >= 5) {
    next = produce(next, (draft) => {
      draft._achTimer = 0;
      checkAchievements(draft as any);
      draft.marketEventCooldown = Math.max(0, (draft.marketEventCooldown || 0) - 5);
      if ((draft.marketEventCooldown || 0) <= 0) {
        if (Math.random() < 0.3 && (draft.marketNewsTimer || 0) === 0) {
          triggerMarketEventLogic(draft as any);
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

export const getSalePricePerGram = (state: GameState) => getSalePricePerGramMarket(state);

export const calcPrestigeGain = (totalEarned: number) => Math.floor(Math.pow(totalEarned / 10000, 0.5));

export const toggleTheme = (state: GameState, theme: 'light' | 'dark') =>
  produce(state, (draft) => {
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

export const harvestPlant = (state: GameState, slotIndex: number) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  if (!plant || plant.growProg < 1) return state;
  const qm = qualityMultiplierPlants(state, plant);
  const yd = harvestYieldDetailsPlants(state, plant);
  const gain = clampYield(yd.value * qm, (yd.breakdown.cap || yd.value) * qm);
  const next = harvestPlantPlants(state, slotIndex, { addXP });
  return checkQuestProgress(next, 'harvest', { strainId: plant.strainId, amount: gain });
};

export const harvestPlantWithBonus = (state: GameState, slotIndex: number, bonus = 1) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  if (!plant || plant.growProg < 1) return state;
  const qm = qualityMultiplierPlants(state, plant);
  const yd = harvestYieldDetailsPlants(state, plant);
  const gain = clampYield(yd.value * qm * bonus, (yd.breakdown.cap || yd.value) * qm * Math.max(1, bonus));
  const next = harvestPlantWithBonusPlants(state, slotIndex, bonus, { addXP });
  return checkQuestProgress(next, 'harvest', { strainId: plant.strainId, amount: gain });
};

export const harvestAllReady = (state: GameState) => {
  let totalGain = 0;
  const next = harvestAllReadyPlants(state, {
    addXP,
    onHarvest: (gain: number) => {
      totalGain += gain;
    }
  });
  if (totalGain > 0) {
    return checkQuestProgress(next, 'harvest', { amount: totalGain });
  }
  return next;
};

export const plantSeed = (state: GameState, slotIndex: number, strainId: string) =>
  plantSeedPlant(state, slotIndex, strainId, { addXP });

export const sellGrams = (state: GameState, grams: number) => {
  grams = Math.max(0, grams);
  if (grams <= 0 || state.grams < grams) return state;
  const pricePerG = getSalePricePerGram(state);
  const cashGain = grams * pricePerG;
  const next = sellGramsMarket(state, grams);
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
  const next = sellToBuyerMarket(state, grams, buyer);
  return checkQuestProgress(checkQuestProgress(next, 'sell', { amount: grams }), 'cash', { amount: cashGain });
};

export const acceptOffer = (state: GameState, id: number | string) => {
  const offer = state.offers.find((o: any) => String(o.id) === String(id));
  if (!offer) return state;
  if (offer.expiresAt <= Date.now()) {
    return declineOfferMarket(state, id);
  }
  if (state.grams < offer.grams) return state;
  const avgQ = (state.qualityPool.grams || 0) > 0 ? state.qualityPool.weighted / state.qualityPool.grams : 1;
  const qMult = saleQualityMultiplier(avgQ);
  const totalCash = offer.grams * offer.pricePerG * qMult;
  const next = acceptOfferMarket(state, id);
  const withXp = produce(next, (draft) => addXP(draft as any, 10));
  return checkQuestProgress(checkQuestProgress(withXp, 'sell', { amount: offer.grams }), 'cash', { amount: totalCash });
};

export const declineOffer = (state: GameState, id: number | string) => declineOfferMarket(state, id);

export const deliverApotheke = (state: GameState, id: number | string) => {
  const offer = (state.apothekenOffers || []).find((o: any) => String(o.id) === String(id));
  if (!offer) return state;
  if (offer.expiresAt <= Date.now()) {
    return produce(state, (draft) => {
      draft.apothekenOffers = (draft.apothekenOffers || []).filter((o: any) => String(o.id) !== String(id));
    });
  }
  if (state.grams < offer.grams) return state;
  const avgQ = (state.qualityPool.grams || 0) > 0 ? state.qualityPool.weighted / state.qualityPool.grams : 1;
  const qMult = saleQualityMultiplier(avgQ);
  const totalCash = offer.grams * offer.pricePerG * qMult;
  const next = deliverApothekeMarket(state, id);
  const withXp = produce(next, (draft) => addXP(draft as any, 12));
  return checkQuestProgress(checkQuestProgress(withXp, 'sell', { amount: offer.grams }), 'cash', { amount: totalCash });
};

export const declineOrder = (state: GameState, id: number | string) => declineOrderMarket(state, id);

export const deliverOrder = (state: GameState, id: number | string) => {
  const order = state.orders.find((o: any) => String(o.id) === String(id));
  if (!order) return state;
  if (order.expiresAt <= Date.now()) {
    return produce(state, (draft) => {
      draft.orders = draft.orders.filter((o: any) => String(o.id) !== String(id));
    });
  }
  if (state.grams < order.grams) return state;
  const avgQ = (state.qualityPool.grams || 0) > 0 ? state.qualityPool.weighted / state.qualityPool.grams : 1;
  const qMult = saleQualityMultiplier(avgQ);
  const totalCash = order.grams * order.pricePerG * qMult;
  const next = deliverOrderMarket(state, id);
  const withXp = produce(next, (draft) => addXP(draft as any, 12));
  return checkQuestProgress(checkQuestProgress(withXp, 'sell', { amount: order.grams }), 'cash', { amount: totalCash });
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

export const startDrying = (state: GameState, batchId?: string) => startDryingProcessing(state, batchId);

export const startCuring = (state: GameState, batchId: string) => startCuringProcessing(state, batchId);

export const collectProcessed = (state: GameState, batchId: string) =>
  collectProcessedProcessing(state, batchId, { addXP });

export const collectAllProcessed = (state: GameState) =>
  collectAllProcessedProcessing(state, { addXP });

export const pressRosin = (state: GameState, batchId: string) =>
  pressRosinProcessing(state, batchId, { addXP, pushMessage });

const calculateHybridProfile = (p1: Strain, p2: Strain, randomFn = Math.random): Strain => {
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
  const baseGeneration = Math.max(Number(p1.generation || 1), Number(p2.generation || 1));
  const generation = baseGeneration + 1;
  const maxTraits = Math.min(1 + generation, 5);
  const combinedTraits = [...(p1.traits || []), ...(p2.traits || [])];
  const traits: StrainTrait[] = [];
  const tryInherit = (t: StrainTrait) => {
    if (traits.length >= maxTraits) return;
    if (traits.find((x) => x.id === t.id)) return;
    if (randomFn() < 0.4) traits.push({ ...t });
  };
  combinedTraits.forEach(tryInherit);
  if (traits.length < maxTraits && randomFn() < 0.2) {
    const pool = Object.values(POSSIBLE_TRAITS);
    const pick = pool[Math.floor(randomFn() * pool.length)];
    if (pick && !traits.find((x) => x.id === pick.id)) traits.push({ ...pick });
  }
  const baseCost = (p1.cost + p2.cost) / 2;
  const baseYield = (p1.yield + p2.yield) / 2;
  const baseGrow = (p1.grow + p2.grow) / 2;
  const baseQuality = (p1.quality + p2.quality) / 2;
  const baseYieldBonus = (p1.yieldBonus || 0 + (p2.yieldBonus || 0)) / 2;
  const baseOfferBonus = (p1.offerBonus || 0 + (p2.offerBonus || 0)) / 2;
  const genLabel = generation === 1 ? 'Hybrid' : generation === 2 ? 'Ultra Hybrid' : generation === 3 ? 'Supra Hybrid' : generation === 4 ? 'Mythic Hybrid' : `Omega Hybrid Gen ${generation}`;
  const name = `${genLabel}: ${p1.name} x ${p2.name}`;
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
    generation,
    traits: traits.slice(0, maxTraits)
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
