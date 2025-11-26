import { produce } from 'immer';
import { POSSIBLE_TRAITS, STRAINS } from '../data';
import { GameState, Plant, Strain, StrainTrait, TraitType } from '../types';

const clampStability = (value: number) => Math.max(0.1, Math.min(1, value));

const mashName = (a: string, b: string) => {
  const cleanA = (a || 'Alpha').replace(/\s+/g, '');
  const cleanB = (b || 'Beta').replace(/\s+/g, '');
  const splitA = Math.max(1, Math.floor(cleanA.length / 2));
  const splitB = Math.max(1, Math.ceil(cleanB.length / 2));
  const candidate = `${cleanA.slice(0, splitA)}${cleanB.slice(cleanB.length - splitB)}`;
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
};

const roll = (randomFn: () => number) => randomFn();

const inheritTraits = (p1: Strain, p2: Strain, randomFn: () => number): StrainTrait[] => {
  const allTraits = [...(p1.traits || []), ...(p2.traits || [])];
  const inherited: StrainTrait[] = [];
  const seen = new Set<string>();

  for (const trait of allTraits) {
    if (seen.has(trait.id)) continue;
    if (roll(randomFn) < 0.4) {
      inherited.push(trait);
      seen.add(trait.id);
    }
  }

  // Mutation chance
  if (roll(randomFn) < 0.1) {
    const available = Object.values(POSSIBLE_TRAITS).filter((t) => !seen.has(t.id));
    if (available.length > 0) {
      const t = available[Math.floor(roll(randomFn) * available.length)];
      inherited.push(t);
      seen.add(t.id);
    }
  }

  return inherited;
};

export const calculateHybridProfile = (p1: Strain, p2: Strain, randomFn = Math.random): Strain => {
  const stability1 = p1.stability ?? 0.8;
  const stability2 = p2.stability ?? 0.8;
  const stability = clampStability(((stability1 + stability2) / 2) * 0.9);
  const volatility = 1 - stability;

  const avgYield = (p1.yield + p2.yield) / 2;
  const yieldSwing = (roll(randomFn) * 2 - 1) * volatility * 0.2; // up to ±20% scaled by stability
  const yieldValue = Math.max(10, Math.round(avgYield * (1 + yieldSwing)));

  const avgGrow = (p1.grow + p2.grow) / 2;
  const growSwing = (roll(randomFn) * 2 - 1) * volatility * 0.15;
  const growValue = Math.max(30, Math.round(avgGrow * (1 + growSwing)));

  const avgQuality = (p1.quality + p2.quality) / 2;
  const qualitySwing = (roll(randomFn) * 2 - 1) * volatility * 0.08;
  const qualityValue = Math.max(0.5, parseFloat((avgQuality * (1 + qualitySwing)).toFixed(2)));

  const rarityOrder: Strain['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const rarityIdx = Math.max(
    rarityOrder.indexOf(p1.rarity || 'common'),
    rarityOrder.indexOf(p2.rarity || 'common')
  );

  const name = mashName(p1.name, p2.name);
  const tag = `${(p1.tag || 'H1').slice(0, 2)}${(p2.tag || 'H2').slice(-2)}`.toUpperCase();

  const traits = inheritTraits(p1, p2, randomFn);

  return {
    id: `hyb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    tag,
    rarity: rarityOrder[rarityIdx] || 'common',
    cost: Math.max(50, Math.round((p1.cost + p2.cost) / 2)),
    yield: yieldValue,
    grow: growValue,
    quality: qualityValue,
    traits,
    stability,
    lineage: { p1: p1.name, p2: p2.name },
    generation: Math.max(p1.generation || 1, p2.generation || 1) + 1
  };
};

const resolveStrain = (state: GameState, id: string): Strain => {
  const custom = (state.customStrains || []).find((s) => s.id === id);
  if (custom) return custom;
  return STRAINS.find((s) => s.id === id) || STRAINS[0];
};

const pushMessage = (state: GameState, text: string, type = 'info') => {
  const id = state.nextMsgId || 1;
  state.nextMsgId = id + 1;
  state.messages.push({ id, text, type, createdAt: Date.now(), unread: true });
  state.unreadMessages = (state.unreadMessages || 0) + 1;
};

export const setBreedingParent = (state: GameState, parent: 1 | 2, strainId: string | null) =>
  produce(state, (draft) => {
    draft.breedingSlots = draft.breedingSlots || { parent1: null, parent2: null };
    draft.breedingSlots[parent === 1 ? 'parent1' : 'parent2'] = strainId;
  });

export const performBreeding = (state: GameState) => {
  const slots = state.breedingSlots || { parent1: null, parent2: null };
  if (!slots.parent1 || !slots.parent2) return state;
  const p1 = resolveStrain(state, slots.parent1);
  const p2 = resolveStrain(state, slots.parent2);
  if (!p1 || !p2) return state;

  return produce(state, (draft) => {
    const parentA = resolveStrain(draft as GameState, slots.parent1!);
    const parentB = resolveStrain(draft as GameState, slots.parent2!);
    const hybrid = calculateHybridProfile(parentA, parentB);
    draft.customStrains = [...(draft.customStrains || []), hybrid];
    draft.seeds[hybrid.id] = (draft.seeds[hybrid.id] || 0) + 1;
    draft.breedingSlots = { parent1: null, parent2: null };
    draft.caseInventory = draft.caseInventory || {};
    pushMessage(draft as GameState, `Neuer Hybrid gezüchtet: ${hybrid.name}`, 'success');
  });
};

export const getTraitMultiplier = (state: GameState, plant: Plant, type: TraitType) => {
  const strain = resolveStrain(state, plant.strainId);
  const traits = strain.traits || [];
  return traits.reduce((m, t) => (t.type === type ? m * (1 + t.value) : m), 1);
};
