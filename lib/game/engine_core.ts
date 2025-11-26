import { produce } from 'immer';
import {
  advancePlant,
  computePerSec as computePerSecPlants,
  ensurePlantDefaults
} from './logic/plants';
import { advanceProcessing } from './logic/processing';
import {
  marketDrift,
  spawnMarketEvent,
  maybeApplyRandomNews
} from './logic/market';
import { employeeActions } from './logic/employees';
import { GameState } from './types';

export const SPEED_OPTIONS = [0, 0.5, 1, 2, 7];

const getTimeSpeed = (state: GameState) => {
  const t = Number(state.timeSpeed);
  return SPEED_OPTIONS.includes(t) ? t : 0;
};

// Lightweight orchestrator tick for future use; does not include quests/achievements.
export const tickStateCore = (state: GameState, realSeconds: number): GameState => {
  const speed = getTimeSpeed(state);
  const worldDt = Math.max(0, realSeconds * speed);
  let next = produce(state, (draft) => {
    draft.playtimeSec += Math.max(0, realSeconds);
    draft.lastTime = Date.now();
    if (worldDt <= 0) return;
    draft.plants.forEach((p) => {
      ensurePlantDefaults(p);
      advancePlant(draft as any, p, worldDt);
    });
    advanceProcessing(draft as any, worldDt);
    marketDrift(draft as any, worldDt);
    if (draft.nextMarketEventIn > 0) draft.nextMarketEventIn = Math.max(0, draft.nextMarketEventIn - worldDt);
    if (draft.marketTimer > 0) draft.marketTimer = Math.max(0, draft.marketTimer - worldDt);
    if (draft.nextMarketEventIn === 0 && draft.marketTimer === 0) spawnMarketEvent(draft as any);
    maybeApplyRandomNews(draft as any, worldDt);
    draft.bestPerSec = Math.max(draft.bestPerSec, computePerSecPlants(draft as any));
  });
  if (worldDt > 0) {
    next = employeeActions(next, worldDt);
  }
  return next;
};

// Re-export modules for convenience
export * from './logic/plants';
export * from './logic/processing';
export * from './logic/market';
export * from './logic/employees';
