'use client';

import { useEffect, useMemo, useState } from 'react';
import { SAVE_KEY } from './data';
import {
  addMessage,
  addToCart,
  applyOfflineProgress,
  bulkFeed,
  bulkWater,
  buyConsumablePack,
  buyItem,
  buySeed,
  checkoutCart,
  clearCart,
  removeCartEntry,
  computePerSec,
  createInitialState,
  formatResources,
  harvestAllReady,
  harvestPlant,
  harvestPlantWithBonus,
  hydrateState,
  buyUpgrade,
  buyEstate,
  sellEstate,
  buyResearchNode,
  calcPrestigeGain,
  doPrestige,
  hireEmployee,
  upgradeEmployee,
  fireEmployee,
  setEmployeeResting,
  performBreeding,
  setBreedingParent,
  dismissBreedingResult,
  buyContract,
  fireContract,
  fireJob,
  markMessagesRead,
  openCase,
  plantSeed,
  removePlant,
  upgradePlant,
  takeJob,
  sellGrams,
  sellToBuyer,
  acceptOffer,
  declineOffer,
  deliverApotheke,
  setDifficulty,
  setInventoryFilters,
  setBulkConserve,
  setSpeed,
  toggleFavoriteStrain,
  setAutoGrow,
  checkQuestProgress,
  claimQuestReward,
  tickState,
  toggleDisplayPrefs,
  toggleTheme,
  treatPlant,
  unlockSlot,
  waterPlant,
  feedPlant,
  feedPlantWithBonus,
  deliverOrder,
  declineOrder,
  applyForJob,
  startDrying,
  startCuring,
  collectProcessed,
  collectAllProcessed,
  pressRosin,
  quickBuyApply
} from './engine';
import { GameState } from './types';
import { gameStateSchema } from './saveSchema';

export type GameActions = ReturnType<typeof buildActions>;

const buildActions = (setState: React.Dispatch<React.SetStateAction<GameState>>) => ({
  setSpeed: (speed: number) => setState((s) => setSpeed(s, speed)),
  setDifficulty: (diff: GameState['difficulty']) => setState((s) => setDifficulty(s, diff)),
  setTheme: (theme: GameState['theme']) => setState((s) => toggleTheme(s, theme)),
  setDisplayPrefs: (compact?: boolean, contrast?: boolean) => setState((s) => toggleDisplayPrefs(s, { compact, contrast })),
  setSoundFx: (on: boolean) => setState((s) => ({ ...s, soundFx: on })),
  setInventoryFilters: (filter: string, sort: string) => setState((s) => setInventoryFilters(s, filter, sort)),
  toggleBulkConserve: (on: boolean) => setState((s) => setBulkConserve(s, on)),
  toggleFavorite: (id: string) => setState((s) => toggleFavoriteStrain(s, id)),
  setAutoGrow: (strainId: string, on: boolean) => setState((s) => setAutoGrow(s, strainId, on)),
  claimQuest: (id: string) => setState((s) => claimQuestReward(s, id)),
  waterPlant: (slot: number) => setState((s) => waterPlant(s, slot)),
  feedPlant: (slot: number) => setState((s) => feedPlant(s, slot)),
  feedPlantWithBonus: (slot: number, bonus?: number) => setState((s) => feedPlantWithBonus(s, slot, bonus)),
  treatPlant: (slot: number) => setState((s) => treatPlant(s, slot)),
  harvestPlant: (slot: number) => setState((s) => harvestPlant(s, slot)),
  harvestPlantWithBonus: (slot: number, bonus?: number) => setState((s) => harvestPlantWithBonus(s, slot, bonus)),
  upgradePlant: (slot: number) => setState((s) => upgradePlant(s, slot)),
  harvestAllReady: () => setState((s) => harvestAllReady(s)),
  bulkWater: () => setState((s) => bulkWater(s)),
  bulkFeed: () => setState((s) => bulkFeed(s)),
  unlockSlot: () => setState((s) => unlockSlot(s)),
  plantSeed: (slot: number, strainId: string) => setState((s) => plantSeed(s, slot, strainId)),
  buySeed: (strainId: string) => setState((s) => buySeed(s, strainId)),
  buyItem: (itemId: string) => setState((s) => buyItem(s, itemId)),
  buyPack: (packId: string) => setState((s) => buyConsumablePack(s, packId)),
  openCase: (caseId: string, fast?: boolean) => setState((s) => openCase(s, caseId, fast)),
  sell: (grams: number) => setState((s) => sellGrams(s, grams)),
  addToCart: (entry: any) => setState((s) => addToCart(s, entry)),
  clearCart: () => setState((s) => clearCart(s)),
  removeCartEntry: (id: string, kind: any) => setState((s) => removeCartEntry(s, id, kind)),
  checkout: () => setState((s) => checkoutCart(s)),
  removePlant: (slot: number) => setState((s) => removePlant(s, slot)),
  addMessage: (text: string, type?: string) => setState((s) => addMessage(s, text, type)),
  markMessagesRead: () => setState((s) => markMessagesRead(s)),
  takeJob: (jobId: string) => setState((s) => takeJob(s, jobId)),
  fireJob: () => setState((s) => fireJob(s)),
  applyForJob: (jobId: string) => setState((s) => applyForJob(s, jobId)),
  resetGame: () => setState(createInitialState()),
  buyUpgrade: (id: string) => setState((s) => buyUpgrade(s, id)),
  buyEstate: (id: string) => setState((s) => buyEstate(s, id)),
  sellEstate: (id: string) => setState((s) => sellEstate(s, id)),
  buyResearch: (id: string) => setState((s) => buyResearchNode(s, id)),
  doPrestige: () => setState((s) => doPrestige(s)),
  acceptOffer: (id: number | string) => setState((s) => acceptOffer(s, id)),
  deliverApotheke: (id: number | string) => setState((s) => deliverApotheke(s, id)),
  deliverOrder: (id: number | string) => setState((s) => deliverOrder(s, id)),
  declineOffer: (id: number | string) => setState((s) => declineOffer(s, id)),
  declineOrder: (id: number | string) => setState((s) => declineOrder(s, id)),
  sellToBuyer: (grams: number, buyer: 'street' | 'market' | 'dispensary') => setState((s) => sellToBuyer(s, grams, buyer)),
  hireEmployee: (id: string) => setState((s) => hireEmployee(s, id)),
  upgradeEmployee: (id: string) => setState((s) => upgradeEmployee(s, id)),
  fireEmployee: (id: string) => setState((s) => fireEmployee(s, id)),
  setEmployeeResting: (id: string, resting: boolean) => setState((s) => setEmployeeResting(s, id, resting)),
  startDrying: (batchId?: string) => setState((s) => startDrying(s, batchId)),
  startCuring: (batchId: string) => setState((s) => startCuring(s, batchId)),
  collectProcessed: (batchId: string) => setState((s) => collectProcessed(s, batchId)),
  collectAllProcessed: () => setState((s) => collectAllProcessed(s)),
  pressRosin: (batchId: string) => setState((s) => pressRosin(s, batchId)),
  importSave: (payload: GameState) => setState(() => applyOfflineProgress(hydrateState(payload))),
  quickBuyApply: (type: 'water' | 'nutrient' | 'spray', slot: number, pack?: boolean) => setState((s) => quickBuyApply(s, type, slot, pack)),
  setBreedingParent: (parent: 1 | 2, strain: string | null) => setState((s) => setBreedingParent(s, parent, strain)),
  performBreeding: () => setState((s) => performBreeding(s)),
  buyContract: (id: string) => setState((s) => buyContract(s, id)),
  fireContract: (id: string) => setState((s) => fireContract(s, id)),
  dismissBreedingResult: () => setState((s) => dismissBreedingResult(s))
});

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(SAVE_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const validated = gameStateSchema.parse(parsed) as unknown as GameState;
        setState((s) => applyOfflineProgress(hydrateState(validated)));
      } catch (err) {
        console.warn('Konnte Spielstand nicht laden', err);
        setState(createInitialState());
      }
    } else {
      setState(createInitialState());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    let raf: number;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setState((s) => tickState(s, dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const body = document.body;
    body.classList.toggle('light', state.theme === 'light');
    body.classList.toggle('compact', !!state.compactMode);
    body.classList.toggle('high-contrast', !!state.highContrast);
  }, [ready, state.theme, state.compactMode, state.highContrast]);

  const actions = useMemo(() => buildActions(setState), []);
  const derived = useMemo(
    () => ({
      perSec: computePerSec(state),
      resources: formatResources(state)
    }),
    [state]
  );

  return { state, setState, actions, derived, ready };
}
