import { clamp } from '../utils';
import { GLOBAL_UPGRADES, GROW_ROOMS, ITEMS, MAX_SLOTS, RESEARCH_TREE, STRAINS } from '../data';
import { GameState, Strain } from '../types';

const CURING_QUALITY_CAP = 2.2;

export const clampQualityValue = (q: number) => clamp(q, 0.4, CURING_QUALITY_CAP);

export const masteryLevelFor = (xp: number) => {
  if (xp >= 1000) return 10;
  if (xp >= 600) return 7;
  if (xp >= 300) return 5;
  if (xp >= 120) return 3;
  if (xp >= 60) return 2;
  if (xp >= 30) return 1;
  return 0;
};

export const masteryForStrain = (state: GameState, strainId: string) => {
  const xp = (state.strainMastery || {})[strainId] || 0;
  return { xp, level: masteryLevelFor(xp) };
};

export const xpForNext = (level: number) => {
  level = Math.max(1, level || 1);
  return Math.floor(100 * Math.pow(1.35, level - 1));
};

export const slotUnlockCost = (current: number) => Math.round(100 * Math.pow(1.75, Math.max(0, current - 1)));

export const upgradeCost = (state: GameState, id: string) => {
  const up = GLOBAL_UPGRADES.find((u) => u.id === id);
  if (!up) return 0;
  const lvl = state.upgrades[id] || 0;
  return Math.round(up.baseCost * Math.pow(1.6, lvl));
};

export const currentGrowRoom = (state: GameState) => GROW_ROOMS[Math.max(0, Math.min(GROW_ROOMS.length - 1, state.growTierIndex || 0))];

export const currentMaxSlots = (state: GameState) => {
  const room = currentGrowRoom(state);
  return Math.min(MAX_SLOTS, room?.slots || 2);
};

export const researchEffects = (state: GameState) => {
  const res = state.research || {};
  const eff: Record<string, number> = {
    yield: 0,
    growth: 0,
    quality: 0,
    pest: 0,
    water: 0,
    cost: 0,
    pest_mold: 0,
    growthTime: 0,
    priceMult: 0,
    nutrientCost: 0
  };
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

export const itemPriceMultiplier = (state: GameState) => {
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

export const itemYieldMultiplier = (state: GameState) => {
  let mult = 1;
  for (const it of ITEMS) {
    const owned = state.itemsOwned[it.id] || 0;
    if (!owned || !it.effects?.yieldMult) continue;
    mult *= Math.pow(it.effects.yieldMult, owned);
  }
  return mult;
};

export const itemQualityMultiplier = (state: GameState) => {
  let mult = 1;
  for (const it of ITEMS) {
    const owned = state.itemsOwned[it.id] || 0;
    if (!owned || !it.effects?.qualityMult) continue;
    mult *= Math.pow(it.effects.qualityMult, owned);
  }
  return mult;
};

export const traitMultiplier = (strain: Strain, type: 'yield' | 'growth' | 'water' | 'pest' | 'quality' | 'price') => {
  const traits = strain?.traits || [];
  return traits.reduce((m, t) => (t.type === type ? m * (1 + t.value) : m), 1);
};

export const traitSpeedMultiplier = (strain: Strain) => {
  const traits = strain?.traits || [];
  let mult = 1;
  for (const t of traits) {
    if (t.type === 'growth') mult *= 1 - t.value; // negative value -> faster
  }
  return Math.max(0.2, mult);
};

export const globalMultiplier = (state: GameState) => {
  let mult = 1;
  for (const up of GLOBAL_UPGRADES) {
    const lvl = state.upgrades[up.id] || 0;
    if (lvl > 0) mult *= Math.pow(1 + up.inc, lvl);
  }
  mult *= itemYieldMultiplier(state);
  mult *= 1 + 0.05 * Math.sqrt(state.hazePoints || 0);
  return mult;
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

export const itemCost = (state: GameState, itemId: string) => {
  const item = ITEMS.find((i) => i.id === itemId);
  if (!item) return 0;
  const count = state.itemsOwned[itemId] || 0;
  const eff = researchEffects(state);
  const base = item.cost * Math.pow(1.2, count);
  return Math.max(1, Math.round(base * (1 - (eff.cost || 0))));
};

export const pestRiskModifiers = (state: GameState) => {
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

export const clampYield = (val: number, cap = 10000) => {
  if (!isFinite(val)) return 0;
  return Math.max(0, Math.min(val, cap));
};
