import { produce } from 'immer';
import { EMPLOYEES, GROW_ROOMS, WATER_MAX } from '../data';
import { GameState, Plant } from '../types';
import {
  waterPlant as waterPlantAction,
  feedPlant as feedPlantAction,
  treatPlant as treatPlantAction,
  harvestPlant as harvestPlantAction,
  plantSeed as plantSeedAction,
  ensureConsumables,
  createPlant,
  WATER_COST,
  WATER_COST_PER_USE
} from './plants';
import { startDrying as startDryingProcessing, ensureProcessing } from './processing';
import { currentGrowRoom, currentMaxSlots } from './shared';

const employeeEnergyCost = (level: number) => Math.max(4, 8 - level);

export const buyEstate = (state: GameState, id: string) => {
  const idx = GROW_ROOMS.findIndex((x) => x.id === id);
  if (idx === -1) return state;
  if ((state.growTierIndex || 0) >= idx) return state;
  const room = GROW_ROOMS[idx];
  if (state.cash < room.cost) return state;
  return produce(state, (draft) => {
    draft.cash -= room.cost;
    draft.growTierIndex = idx;
    draft.slotsUnlocked = room.slots; // Bugfix: sofort alle Slots freischalten
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

const runGrowHelper = (state: GameState, maxActions: number): { state: GameState; done: number } => {
  let next = state;
  let remaining = maxActions;
  let done = 0;
  // Harvest ready plants first
  const ready = next.plants.filter((p) => p.growProg >= 1 && p.health > 0 && (next.itemsOwned?.['shears'] || 0) > 0);
  for (const plant of ready) {
    if (remaining <= 0) break;
    const before = next;
    next = harvestPlantAction(next, plant.slot);
    if (next !== before) {
      remaining--;
      done++;
    }
  }
  if (remaining <= 0) return { state: next, done };
  // care list sorted by thirst/nutrient
  const careList = [...next.plants].filter((p) => p.health > 0).sort((a, b) => (a.water + a.nutrients) - (b.water + b.nutrients));
  for (const plant of careList) {
    if (remaining <= 0) break;
    const before = next;
    if (plant.water < WATER_MAX * 0.4) {
      next = waterPlantAction(next, plant.slot);
      if (next !== before) {
        remaining--;
        done++;
      }
    }
    if (remaining <= 0) break;
    if (plant.nutrients < WATER_MAX * 0.4) {
      next = feedPlantAction(next, plant.slot);
      if (next !== before) {
        remaining--;
        done++;
      }
    }
  }
  if (remaining <= 0) return { state: next, done };
  // plant seeds in empty slots
  const used = new Set(next.plants.map((p) => p.slot));
  const maxSlots = next.slotsUnlocked || 0;
  const seeds = next.seeds || {};
  let seedId: string | null = null;
  for (const key of Object.keys(seeds)) {
    if ((seeds[key] || 0) > 0) {
      seedId = key;
      break;
    }
  }
  for (let slot = 0; slot < maxSlots && remaining > 0 && seedId; slot++) {
    if (used.has(slot)) continue;
    const before = next;
    next = plantSeedAction(next, slot, seedId);
    if (next !== before) {
      remaining--;
      done++;
    }
  }
  return { state: next, done };
};

type EmployeeDeps = {
  addXP?: (state: GameState, amount: number) => void;
};

export const performEmployeeTask = (state: GameState, task: string, deps: EmployeeDeps = {}): { state: GameState; worked: boolean } => {
  const plants = state.plants.filter((p) => p.health > 0);
  if (plants.length === 0) return { state, worked: false };
  const plant = plants[Math.floor(Math.random() * plants.length)];
  const slot = plant.slot;
  let next = state;

  if (task === 'water') {
    next = waterPlantAction(state, slot);
    return { state: next, worked: next !== state };
  }
  if (task === 'feed') {
    next = feedPlantAction(state, slot);
    return { state: next, worked: next !== state };
  }
  if (task === 'harvest') {
    const harvested = harvestPlantAction(state, slot, { addXP: deps.addXP });
    if (harvested !== state) return { state: harvested, worked: true };
    // fallback: try to move existing wet batches into drying
    const proc = ensureProcessing(state);
    if ((proc.wet || []).length > 0) {
      next = startDryingProcessing(state);
      return { state: next, worked: next !== state };
    }
    return { state, worked: false };
  }
  if (task === 'treat') {
    next = treatPlantAction(state, slot);
    return { state: next, worked: next !== state };
  }
  return { state, worked: false };
};

export const employeeActions = (state: GameState, dt: number, deps: EmployeeDeps = {}): GameState => {
  const timer = (state._empTimer || 0) + dt;
  if (timer < 5) {
    return produce(state, (draft) => {
      draft._empTimer = timer;
    });
  }
  let next = produce(state, (draft) => {
    draft._empTimer = 0;
  });
  let working = next;
  working = ensureConsumables(working);
  const breakroomLevel = working.upgrades?.['breakroom'] || 0;

  for (const emp of EMPLOYEES) {
    const data = working.employees[emp.id];
    if (!data) continue;
    const energy = typeof data.energy === 'number' ? data.energy : 100;
    const level = data.level || 1;
    const costPerAction = employeeEnergyCost(level);
    let currentEnergy = energy;
    let resting = !!data.resting;

    if (resting) {
      if ((working.consumables.coffee || 0) > 0) {
        working = produce(working, (draft) => {
          draft.consumables.coffee = Math.max(0, (draft.consumables.coffee || 0) - 1);
          draft.employees[emp.id].energy = 100;
          draft.employees[emp.id].resting = false;
        });
        continue;
      }
      const regen = 6 * (1 + 0.5 * breakroomLevel);
      currentEnergy = Math.min(100, currentEnergy + regen);
      resting = currentEnergy < 80;
      working = produce(working, (draft) => {
        draft.employees[emp.id].energy = currentEnergy;
        draft.employees[emp.id].resting = resting;
      });
      continue;
    }

    if (emp.id === 'growhelper') {
      const maxByEnergy = Math.max(0, Math.floor(currentEnergy / costPerAction));
      const allowance = Math.min(emp.capacity || 1, maxByEnergy);
      if (allowance <= 0) {
        working = produce(working, (draft) => {
          draft.employees[emp.id].resting = true;
        });
        continue;
      }
      const result = runGrowHelper(working, allowance);
      working = result.state;
      currentEnergy = Math.max(0, currentEnergy - result.done * costPerAction);
      const newRest = currentEnergy <= 5;
      working = produce(working, (draft) => {
        draft.employees[emp.id].energy = currentEnergy;
        draft.employees[emp.id].resting = newRest;
      });
      continue;
    }

    for (const task of emp.tasks) {
      if (currentEnergy <= 0) {
        resting = true;
        break;
      }
      const { state: updated, worked } = performEmployeeTask(working, task, deps);
      if (worked) {
        currentEnergy = Math.max(0, currentEnergy - costPerAction);
        working = updated;
      }
      if (currentEnergy <= 5) {
        resting = true;
        break;
      }
    }

    working = produce(working, (draft) => {
      draft.employees[emp.id].energy = currentEnergy;
      draft.employees[emp.id].resting = resting;
    });
  }

  return working;
};
