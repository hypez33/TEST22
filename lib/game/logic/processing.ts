import { isDraft, produce } from 'immer';
import { clamp, fmtNumber } from '../utils';
import { GameState, ProcessingState } from '../types';
import { clampQualityValue } from './shared';

export const DRYING_TIME_SEC = 240;
export const CURING_TIME_SEC = 300;
export const DRY_WEIGHT_MULT = 0.3;
export const DRY_PRICE_MULT = 1.5;
export const CURING_QUALITY_BONUS = 0.25;
export const ROSIN_YIELD_MULT = 0.35;
export const ROSIN_MIN_QUALITY = 1;

type ProcessingDeps = {
  addXP?: (state: GameState, amt: number) => void;
  pushMessage?: (state: GameState, text: string, type?: string) => void;
};

const withProduce = <T extends GameState>(state: T, recipe: (draft: T) => void): T => {
  if (isDraft(state)) {
    recipe(state);
    return state;
  }
  return produce(state, recipe);
};

export const ensureProcessing = (state: any): ProcessingState => {
  const normalize = (source?: Partial<ProcessingState>): ProcessingState => {
    const slots = source?.slots || { drying: 2, curing: 2 };
    return {
      wet: Array.isArray(source?.wet) ? source!.wet : [],
      drying: Array.isArray(source?.drying) ? source!.drying : [],
      curing: Array.isArray(source?.curing) ? source!.curing : [],
      ready: Array.isArray(source?.ready) ? source!.ready : [],
      slots: { drying: slots.drying || 2, curing: slots.curing || 2 }
    };
  };
  if (isDraft(state)) {
    state.processing = normalize(state.processing);
    return state.processing;
  }
  const next = { ...(state as GameState) };
  next.processing = normalize(state.processing);
  return next.processing;
};

export const fillDryingSlots = (proc: ProcessingState) => {
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

export const advanceProcessing = (state: GameState, worldDt: number) => {
  if (worldDt <= 0) return state;
  const apply = (draft: GameState) => {
    const proc = ensureProcessing(draft);
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
  return withProduce(state, apply);
};

export const startDrying = (state: GameState, batchId?: string) => {
  const proc = ensureProcessing(state);
  const hasSpace = (proc.slots?.drying || 0) > (proc.drying || []).length;
  if (!hasSpace || (proc.wet || []).length === 0) return state;
  return withProduce(state, (draft) => {
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
  return withProduce(state, (draft) => {
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

export const collectProcessed = (state: GameState, batchId: string, deps: ProcessingDeps = {}) => {
  const proc = ensureProcessing(state);
  const idx = (proc.ready || []).findIndex((b) => b.id === batchId);
  if (idx === -1) return state;
  return withProduce(state, (draft) => {
    const p = ensureProcessing(draft);
    const i = (p.ready || []).findIndex((b) => b.id === batchId);
    if (i === -1) return;
    const batch = p.ready.splice(i, 1)[0];
    const q = clampQualityValue(batch.quality);
    draft.grams += batch.grams;
    draft.totalEarned += batch.grams;
    draft.qualityPool.grams = (draft.qualityPool.grams || 0) + batch.grams;
    draft.qualityPool.weighted = (draft.qualityPool.weighted || 0) + batch.grams * q;
    if (deps.addXP) deps.addXP(draft, Math.max(1, Math.floor(batch.grams / 40)));
  });
};

export const collectAllProcessed = (state: GameState, deps: ProcessingDeps = {}) => {
  const proc = ensureProcessing(state);
  if ((proc.ready || []).length === 0) return state;
  return withProduce(state, (draft) => {
    const p = ensureProcessing(draft);
    for (const batch of p.ready) {
      const q = clampQualityValue(batch.quality);
      draft.grams += batch.grams;
      draft.totalEarned += batch.grams;
      draft.qualityPool.grams = (draft.qualityPool.grams || 0) + batch.grams;
      draft.qualityPool.weighted = (draft.qualityPool.weighted || 0) + batch.grams * q;
      if (deps.addXP) deps.addXP(draft, Math.max(1, Math.floor(batch.grams / 40)));
    }
    p.ready = [];
  });
};

export const pressRosin = (state: GameState, batchId: string, deps: ProcessingDeps = {}) => {
  const proc = ensureProcessing(state);
  const idx = (proc.ready || []).findIndex((b) => b.id === batchId);
  if (idx === -1) return state;
  return withProduce(state, (draft) => {
    const p = ensureProcessing(draft);
    const i = (p.ready || []).findIndex((b) => b.id === batchId);
    if (i === -1) return;
    const b = p.ready.splice(i, 1)[0];
    const output = Math.max(0, b.grams * ROSIN_YIELD_MULT);
    draft.concentrates = (draft.concentrates || 0) + output;
    if (deps.addXP) deps.addXP(draft, Math.max(1, Math.floor(output / 5)));
    if (deps.pushMessage) deps.pushMessage(draft, `Rosin gewonnen: ${fmtNumber(output)}g`, 'success');
  });
};

export const DRYING_TIME = DRYING_TIME_SEC;
export const CURING_TIME = CURING_TIME_SEC;
export const DRY_WEIGHT_MULTIPLIER = DRY_WEIGHT_MULT;
export const DRY_PRICE_MULTIPLIER = DRY_PRICE_MULT;
