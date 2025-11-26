import { isDraft, produce } from 'immer';
import {
  DIFFICULTIES,
  EXTRA_PESTS,
  GROW_ROOMS,
  HEALTH_DECAY_DRY,
  HEALTH_DECAY_HUNGRY,
  HEALTH_RECOVER_RATE,
  ITEMS,
  MAX_SLOTS,
  NUTRIENT_ADD_AMOUNT,
  NUTRIENT_DRAIN_PER_SEC,
  NUTRIENT_MAX,
  NUTRIENT_START,
  PESTS,
  PGR_BOOST_SEC,
  QUALITY_GAIN_GOOD,
  QUALITY_LOSS_BAD,
  READY_DECAY_DELAY,
  STAGE_LABELS,
  STRAINS,
  WATER_ADD_AMOUNT,
  WATER_DRAIN_PER_SEC,
  WATER_MAX,
  WATER_START
} from '../data';
import { GameState, Plant, Strain } from '../types';
import {
  clampQualityValue,
  clampYield,
  currentGrowRoom,
  globalMultiplier,
  itemQualityMultiplier,
  masteryForStrain,
  pestRiskModifiers,
  researchEffects,
  seedCost,
  slotUnlockCost,
  traitMultiplier,
  traitSpeedMultiplier
} from './shared';
import { clamp } from '../utils';
import { ensureProcessing, fillDryingSlots } from './processing';

export const WATER_COST = 0.2;
export const WATER_COST_PER_USE = WATER_COST;

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

const currentDayOfYear = (state: GameState) => {
  const total = Math.floor(state.gameDaysTotal || 0);
  return (total % 365) + 1;
};

const isWinter = (doy: number) => doy >= 335 || doy <= 59;
const isSummer = (doy: number) => doy >= 152 && doy <= 243;

export const harvestYieldDetails = (state: GameState, plant: Plant) => {
  const strain = getStrain(state, plant.strainId);
  const base = strain.yield || 10;
  if (plant.growProg < 0.62)
    return {
      value: 0,
      breakdown: {
        base,
        flowerBonus: 0,
        levelMult: 1,
        researchMult: 1,
        globalMult: 1,
        mastery: 1,
        timing: 1,
        event: state.harvestBonus || 1,
        cap: 0,
        appliedCap: false,
        traitYield: 1,
        traitQuality: 1
      }
    };
  const flowerProgress = Math.max(0, (plant.growProg - 0.62) / 0.38);
  const flowerBonus = 0.3 + flowerProgress * 0.7;
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
  const traitYield = traitMultiplier(strain, 'yield');
  const traitQuality = traitMultiplier(strain, 'quality');
  const raw = base * flowerBonus * levelMult * researchMult * globalMult * bonus * masteryYield * timingBonus * traitYield * traitQuality;
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
      traitYield,
      traitQuality,
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
  return [0, 0.5, 1, 2, 7].includes(t) ? t : 0;
};

export const computePerSec = (state: GameState) => {
  const base = state.plants.reduce((sum, plant) => {
    const p = ensurePlantDefaults(plant);
    if (p.growProg >= 1 || p.health <= 0) return sum;
    const slow = p.water <= 0 || p.nutrients <= 0 ? 0.25 : 1;
    const d = DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal;
    const effTime = growTimeFor(state, p) / (d.growth || 1);
    const dryPer = harvestYieldFor(state, p) * qualityMultiplier(state, p) * 0.3;
    return sum + (dryPer / effTime) * slow;
  }, 0);
  return base * getTimeSpeed(state);
};

const pestDefById = (id: string) => {
  const p = PESTS.find((pest) => pest.id === id);
  if (p) return p;
  return EXTRA_PESTS[id];
};

export const advancePlant = (state: GameState, plant: Plant, delta: number) => {
  ensurePlantDefaults(plant);
  if (delta <= 0) return;
  const strain = getStrain(state, plant.strainId);
  const growTime = growTimeFor(state, plant);
  const res = researchEffects(state);
  const waterTrait = Math.max(0.1, traitMultiplier(strain, 'water'));
  const waterDrain = WATER_DRAIN_PER_SEC * (state.eventWaterMult || 1) * (1 - (res.water || 0)) * waterTrait;
  const nutrientDrain = NUTRIENT_DRAIN_PER_SEC;

  let remaining = delta;
  let pgrLeft = plant.pgrBoostSec || 0;

  const segment = (dt: number) => {
    const waterRatio = plant.water / WATER_MAX;
    const nutrientRatio = plant.nutrients / NUTRIENT_MAX;
    const goodWater = waterRatio >= 0.4 && waterRatio <= 0.85;
    const goodNutrient = nutrientRatio >= 0.4 && nutrientRatio <= 0.8;

    const d = DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal;
    let growthFactor = d.growth * (state.growthBonus || 1) * traitSpeedMultiplier(strain);
    let healthDelta = 0;
    let qualityDelta = 0;

    const pgrActive = pgrLeft > 0;
    const pgrUse = Math.min(pgrLeft, dt);
    if (pgrActive) {
      growthFactor *= 1.25;
      qualityDelta -= 0.002 * pgrUse;
      pgrLeft = Math.max(0, pgrLeft - dt);
    }

    if (plant.water <= 0) {
      healthDelta -= HEALTH_DECAY_DRY * dt;
      qualityDelta -= QUALITY_LOSS_BAD * dt;
      growthFactor *= 0.05;
    } else if (waterRatio < 0.25) {
      healthDelta -= (HEALTH_DECAY_DRY / 2) * dt;
      qualityDelta -= (QUALITY_LOSS_BAD / 2) * dt;
      growthFactor *= 0.35;
    } else if (waterRatio > 0.9) {
      qualityDelta -= 0.02 * dt;
      growthFactor *= 0.8;
    } else if (goodWater) {
      qualityDelta += QUALITY_GAIN_GOOD * dt;
      healthDelta += HEALTH_RECOVER_RATE * 0.3 * dt;
    }

    if (plant.nutrients <= 0) {
      healthDelta -= HEALTH_DECAY_HUNGRY * dt;
      qualityDelta -= QUALITY_LOSS_BAD * dt;
      growthFactor *= 0.25;
    } else if (nutrientRatio < 0.3) {
      healthDelta -= (HEALTH_DECAY_HUNGRY / 2) * dt;
      qualityDelta -= (QUALITY_LOSS_BAD / 2) * dt;
      growthFactor *= 0.5;
    } else if (nutrientRatio > 0.9) {
      qualityDelta -= 0.015 * dt;
    } else if (goodNutrient) {
      qualityDelta += QUALITY_GAIN_GOOD * 0.8 * dt;
    }

    if (plant.health < 40) growthFactor *= 0.6;

    const doy = currentDayOfYear(state);
    if (isWinter(doy) && !(state.upgrades?.['climate'] || 0)) {
      growthFactor *= 0.9;
    }

    if (!plant.pest) {
      maybeSpawnPestFor(state, plant, strain, dt, waterRatio, nutrientRatio);
    } else {
      const pestDef = pestDefById(plant.pest.id) || { effect: { growth: 0.8, health: -1, quality: -0.01 } };
      const sevStart = plant.pest.sev || 1;
      const sevEnd = Math.min(3, sevStart + 0.04 * dt);
      const sevAvg = (sevStart + sevEnd) / 2;
      growthFactor *= Math.max(0.2, pestDef.effect.growth || 1);
      healthDelta += (pestDef.effect.health || 0) * (0.5 + 0.5 * sevAvg) * dt;
      qualityDelta += (pestDef.effect.quality || 0) * (0.5 + 0.5 * sevAvg) * dt;
      plant.pest.sev = sevEnd;
    }
    if (plant.health > 85 && goodWater && goodNutrient) growthFactor *= 1.1;

    if (plant.growProg < 1) {
      plant.growProg = clamp(plant.growProg + (dt / growTime) * growthFactor, 0, 1);
      if (plant.growProg >= 1) plant.readyTime = 0;
    } else {
      plant.readyTime = (plant.readyTime || 0) + dt;
      if (plant.readyTime > READY_DECAY_DELAY) {
        qualityDelta -= (QUALITY_LOSS_BAD / 2) * dt;
      }
    }

    if (goodWater && goodNutrient && plant.growProg < 1 && plant.health > 50) {
      healthDelta += HEALTH_RECOVER_RATE * dt;
    }

    plant.health = clamp(plant.health + healthDelta, 0, 100);
    plant.quality = clamp(plant.quality + qualityDelta, 0.4, 1.5);
  };

  for (let i = 0; i < 5 && remaining > 0; i++) {
    const timeUntilThirsty = waterDrain > 0 ? plant.water / waterDrain : Infinity;
    const timeUntilHungry = nutrientDrain > 0 ? plant.nutrients / nutrientDrain : Infinity;
    const timeUntilPgrEnds = pgrLeft > 0 ? pgrLeft : Infinity;
    const seg = Math.min(remaining, timeUntilThirsty, timeUntilHungry, timeUntilPgrEnds);
    const dt = seg === Infinity ? remaining : seg;

    segment(dt);

    // apply resource drains for the segment
    if (waterDrain > 0) plant.water = clamp(plant.water - waterDrain * dt, 0, WATER_MAX);
    if (nutrientDrain > 0) plant.nutrients = clamp(plant.nutrients - nutrientDrain * dt, 0, NUTRIENT_MAX);

    remaining -= dt;
    if (plant.health <= 0) {
      plant.health = 0;
      plant.growProg = Math.min(plant.growProg, 0.1);
      break;
    }
  }
};

const maybeSpawnPestFor = (state: GameState, plant: Plant, strain: Strain, dt: number, waterRatio: number, nutrientRatio: number) => {
  const d = DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal;
  const mods = pestRiskModifiers(state);
  const pestRate = state.pestGlobalRate || 0.002;
  const traitRisk = Math.max(0.05, traitMultiplier(strain, 'pest'));
  const stagesIdx = Math.min(STAGE_LABELS.length - 1, Math.floor(plant.growProg * STAGE_LABELS.length));
  const inFlower = STAGE_LABELS[stagesIdx] === 'Bluete';
  for (const pest of PESTS) {
    let risk = pest.base * dt * (d.pest || 1) * (pestRate || 1) * traitRisk;
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
    let r1 = (EXTRA_PESTS.root_rot.base || 0.006) * dt * (pestRate || 1) * traitRisk;
    r1 *= waterRatio > 0.9 ? 6 : 0.1;
    if (Math.random() < r1) {
      plant.pest = { id: 'root_rot', sev: 1 };
      return;
    }
    let r2 = (EXTRA_PESTS.leaf_rot.base || 0.008) * dt * (pestRate || 1) * traitRisk;
    r2 *= nutrientRatio > 0.9 ? 5 : 0.1;
    if (Math.random() < r2) {
      plant.pest = { id: 'leaf_rot', sev: 1 };
    }
  }
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

const addMasteryXp = (state: GameState, strainId: string, xp: number) => {
  state.strainMastery = state.strainMastery || {};
  state.strainMastery[strainId] = (state.strainMastery[strainId] || 0) + xp;
};

export const harvestPlant = (state: GameState, slotIndex: number, deps: { addXP?: (s: GameState, amt: number) => void } = {}) => {
  const idx = state.plants.findIndex((p) => p.slot === slotIndex);
  if (idx === -1) return state;
  const plant = state.plants[idx];
  if (plant.growProg < 1) return state;
  const qm = qualityMultiplier(state, plant);
  const mastery = masteryForStrain(state, plant.strainId);
  const qBonus = mastery.level >= 10 && Math.random() < 0.15 ? qm * 2 : qm;
  const yd = harvestYieldDetails(state, plant);
  const gain = clampYield(yd.value * qm, (yd.breakdown.cap || yd.value) * qm);
  const dryEstimate = gain * 0.3;
  const next = produce(state, (draft) => {
    draft.itemsOwned = draft.itemsOwned || {};
    if ((draft.itemsOwned['shears'] || 0) > 0) {
      draft.itemsOwned['shears'] = Math.max(0, (draft.itemsOwned['shears'] || 0) - 1);
    }
    addMasteryXp(draft as any, plant.strainId, 10);
    const proc = ensureProcessing(draft);
    proc.wet.push({ id: Math.random().toString(36).slice(2, 9), strainId: plant.strainId, grams: gain, quality: qBonus, stage: 'wet', createdAt: Date.now() });
    fillDryingSlots(proc);
    draft.plants = draft.plants.filter((p) => p.slot !== slotIndex);
    const tierBonus = qm >= 1.3 ? 1.5 : qm >= 1.1 ? 1.2 : 1;
    if (deps.addXP) deps.addXP(draft, Math.max(1, Math.floor((dryEstimate / 50) * tierBonus)));
    if (draft.autoGrow?.[plant.strainId] && (draft.seeds[plant.strainId] || 0) > 0 && slotIndex < (draft.slotsUnlocked || 0)) {
      draft.seeds[plant.strainId] = Math.max(0, (draft.seeds[plant.strainId] || 0) - 1);
      draft.plants.push(createPlant(plant.strainId, slotIndex));
    }
  });
  return next;
};

export const harvestPlantWithBonus = (state: GameState, slotIndex: number, bonus = 1, deps: { addXP?: (s: GameState, amt: number) => void } = {}) => {
  const idx = state.plants.findIndex((p) => p.slot === slotIndex);
  if (idx === -1) return state;
  const plant = state.plants[idx];
  if (plant.growProg < 1) return state;
  const qm = qualityMultiplier(state, plant);
  const mastery = masteryForStrain(state, plant.strainId);
  const qBonus = mastery.level >= 10 && Math.random() < 0.15 ? qm * 2 : qm;
  const yd = harvestYieldDetails(state, plant);
  const gain = clampYield(yd.value * qm * bonus, (yd.breakdown.cap || yd.value) * qm * Math.max(1, bonus));
  const dryEstimate = gain * 0.3;
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
    proc.wet.push({ id: Math.random().toString(36).slice(2, 9), strainId: plant.strainId, grams: gain, quality: qBonus, stage: 'wet', createdAt: Date.now() });
    fillDryingSlots(proc);
    draft.plants = draft.plants.filter((p) => p.slot !== slotIndex);
    const tierBonus = qm >= 1.3 ? 1.5 : qm >= 1.1 ? 1.2 : 1;
    if (deps.addXP) deps.addXP(draft, Math.max(1, Math.floor((dryEstimate / 50) * tierBonus * bonus)));
    if (draft.autoGrow?.[plant.strainId] && (draft.seeds[plant.strainId] || 0) > 0 && slotIndex < (draft.slotsUnlocked || 0)) {
      draft.seeds[plant.strainId] = Math.max(0, (draft.seeds[plant.strainId] || 0) - 1);
      draft.plants.push(createPlant(plant.strainId, slotIndex));
    }
  });
  return next;
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

export const harvestAllReady = (state: GameState, deps: { addXP?: (s: GameState, amt: number) => void; onHarvest?: (gain: number) => void } = {}) => {
  return produce(state, (draft) => {
    const proc = ensureProcessing(draft);
    const ready = draft.plants.filter((p) => p.growProg >= 1);
    ready.forEach((p) => {
      const qm = qualityMultiplier(draft as any, p);
      const mastery = masteryForStrain(draft as any, p.strainId);
      const qBonus = mastery.level >= 10 && Math.random() < 0.15 ? qm * 2 : qm;
      const gain = harvestYieldFor(draft as any, p) * qm;
      const dryEstimate = gain * 0.3;
      proc.wet.push({ id: Math.random().toString(36).slice(2, 9), strainId: p.strainId, grams: gain, quality: qBonus, stage: 'wet', createdAt: Date.now() });
      if (deps.addXP) deps.addXP(draft as any, Math.max(1, Math.floor(dryEstimate / 50)));
      if (deps.onHarvest) deps.onHarvest(gain);
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
};

export const unlockSlot = (state: GameState) => {
  const unlocked = Math.max(0, state.slotsUnlocked || 0);
  const cap = Math.min(MAX_SLOTS, (currentGrowRoom(state)?.slots || 2));
  if (unlocked >= cap) return state;
  const cost = slotUnlockCost(unlocked);
  if (state.grams < cost) return state;
  return produce(state, (draft) => {
    draft.grams -= cost;
    draft.slotsUnlocked = Math.min(cap, unlocked + 1);
  });
};

export const plantSeed = (state: GameState, slotIndex: number, strainId: string, deps: { addXP?: (s: GameState, amt: number) => void } = {}) => {
  const unlocked = Math.max(0, state.slotsUnlocked || 0);
  if (slotIndex >= unlocked) return state;
  if (state.plants.some((p) => p.slot === slotIndex)) return state;
  if ((state.seeds[strainId] || 0) <= 0) return state;
  return produce(state, (draft) => {
    draft.seeds[strainId] = Math.max(0, (draft.seeds[strainId] || 0) - 1);
    draft.plants.push(createPlant(strainId, slotIndex));
    if (deps.addXP) deps.addXP(draft as any, 6);
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

export const upgradePlant = (state: GameState, slotIndex: number) => {
  const plant = state.plants.find((p) => p.slot === slotIndex);
  if (!plant) return state;
  const cost = plantUpgradeCost(state, plant);
  if (state.grams < cost) return state;
  return produce(state, (draft) => {
    draft.grams -= cost;
    const p = draft.plants.find((pl: any) => pl.slot === slotIndex);
    if (p) p.level += 1;
  });
};

export const getAllStrains = (state: GameState) => STRAINS.concat(state.customStrains || []);

export const getStrain = (state: GameState, id: string): Strain => {
  const custom = (state.customStrains || []).find((s) => s.id === id);
  if (custom) return custom;
  return STRAINS.find((s) => s.id === id) || STRAINS[0];
};

export const ensureConsumables = (state: any): GameState => {
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
