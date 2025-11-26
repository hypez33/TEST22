import { produce } from 'immer';
import { BASE_PRICE_PER_G, ITEMS, MAX_ACTIVE_OFFERS_BASE, OFFER_SPAWN_MAX, OFFER_SPAWN_MIN, STRAINS } from '../data';
import { clamp } from '../utils';
import { GameState } from '../types';
import { itemPriceMultiplier } from './shared';

type MarketEvent = { type: string; name: string; desc: string; duration: number };

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

const MARKET_EVENTS: MarketEvent[] = [
  { type: 'heatwave', name: 'Hitzewelle', desc: 'Wasserverbrauch +50%', duration: 300 },
  { type: 'festival', name: 'Festival in der Stadt', desc: 'Preise +20%', duration: 600 }
];

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

const currentMaxOffers = (state: GameState) => {
  const extra = state.itemsOwned['van'] || 0;
  return MAX_ACTIVE_OFFERS_BASE + extra;
};

export const getSalePricePerGram = (state: GameState) => {
  const base = BASE_PRICE_PER_G * (state.marketMult || 1);
  const trendMult = state.marketTrendMult || 1;
  const newsMult = state.marketNewsMult || 1;
  const itemMult = itemPriceMultiplier(state);
  const avgQ = (state.qualityPool.grams || 0) > 0 ? state.qualityPool.weighted / state.qualityPool.grams : 1;
  const qMult = 1 + clamp(avgQ - 1, -0.6, 2);
  return base * trendMult * newsMult * itemMult * qMult;
};

export const sellGrams = (state: GameState, grams: number) => {
  grams = Math.max(0, grams);
  if (grams <= 0 || state.grams < grams) return state;
  const pricePerG = getSalePricePerGram(state);
  const cashGain = grams * pricePerG;
  return produce(state, (draft) => {
    draft.grams -= grams;
    draft.cash += cashGain;
    draft.totalCashEarned += cashGain;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
  });
};

export const sellToBuyer = (state: GameState, grams: number, buyer: 'street' | 'market' | 'dispensary') => {
  grams = Math.max(0, grams);
  if (grams <= 0 || state.grams < grams) return state;
  let mult = 1;
  if (buyer === 'street') mult = 0.85;
  if (buyer === 'dispensary') mult = 1.15;
  const pricePerG = getSalePricePerGram(state) * mult;
  const cashGain = grams * pricePerG;
  return produce(state, (draft) => {
    draft.grams -= grams;
    draft.cash += cashGain;
    draft.totalCashEarned += cashGain;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
  });
};

export const spawnOffer = (state: GameState) => {
  const scale = Math.max(1, Math.sqrt(Math.max(1, state.totalEarned)) / 20);
  const grams = clamp(Math.floor(40 * scale + Math.random() * (400 * scale)), 20, 1000000);
  const priceMult = 1.1 + Math.random() * 0.9;
  const pricePerG = parseFloat((BASE_PRICE_PER_G * priceMult).toFixed(2));
  const ttl = 60 + Math.floor(Math.random() * 120);
  const id = String(Math.floor(Math.random() * 1e6));
  state.offers.push({ id, grams, pricePerG, expiresAt: Date.now() + ttl * 1000 });
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
  return produce(state, (draft) => {
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
  });
};

export const declineOffer = (state: GameState, id: number | string) =>
  produce(state, (draft) => {
    draft.offers = (draft.offers || []).filter((o: any) => String(o.id) !== String(id));
  });

export const spawnApothekenOffer = (state: GameState) => {
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
  return produce(state, (draft) => {
    const avgQ = (draft.qualityPool.grams || 0) > 0 ? draft.qualityPool.weighted / draft.qualityPool.grams : 1;
    const qMult = saleQualityMultiplier(avgQ);
    const total = offer.grams * offer.pricePerG * qMult;
    draft.grams -= offer.grams;
    const usedWeighted = Math.min(draft.qualityPool.weighted || 0, avgQ * offer.grams);
    draft.qualityPool.grams = Math.max(0, (draft.qualityPool.grams || 0) - offer.grams);
    draft.qualityPool.weighted = Math.max(0, (draft.qualityPool.weighted || 0) - usedWeighted);
    draft.cash += total;
    draft.totalCashEarned += total;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
    draft.apothekenOffers = (draft.apothekenOffers || []).filter((o: any) => o.id !== id);
  });
};

export const spawnOrder = (state: GameState) => {
  const strain = STRAINS[Math.floor(Math.random() * STRAINS.length)];
  const base = BASE_PRICE_PER_G * (state.marketMult || 1);
  const pricePerG = parseFloat((base * (1.2 + Math.random() * 0.6)).toFixed(2));
  const grams = Math.floor(50 + Math.random() * 250);
  const ttl = 120 + Math.floor(Math.random() * 240);
  const id = Math.floor(Math.random() * 1e6).toString();
  state.orders = state.orders || [];
  state.orders.push({ id, strainId: strain.id, grams, pricePerG, expiresAt: Date.now() + ttl * 1000 });
};

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
  return produce(state, (draft) => {
    const avgQ = (draft.qualityPool.grams || 0) > 0 ? draft.qualityPool.weighted / draft.qualityPool.grams : 1;
    const qMult = saleQualityMultiplier(avgQ);
    const total = order.grams * order.pricePerG * qMult;
    draft.grams -= order.grams;
    const usedWeighted = Math.min(draft.qualityPool.weighted || 0, avgQ * order.grams);
    draft.qualityPool.grams = Math.max(0, (draft.qualityPool.grams || 0) - order.grams);
    draft.qualityPool.weighted = Math.max(0, (draft.qualityPool.weighted || 0) - usedWeighted);
    draft.cash += total;
    draft.totalCashEarned += total;
    draft.tradesDone = (draft.tradesDone || 0) + 1;
    draft.reputation = (draft.reputation || 0) + 1;
    draft.orders = draft.orders.filter((o: any) => String(o.id) !== String(id));
  });
};

export const declineOrder = (state: GameState, id: number | string) =>
  produce(state, (draft) => {
    draft.orders = (draft.orders || []).filter((o: any) => String(o.id) !== String(id));
  });

const saleQualityMultiplier = (avgQ: number) => {
  if (!isFinite(avgQ) || avgQ <= 0) return 1;
  if (avgQ >= 1.35) return 1.6;
  if (avgQ >= 1.15) return 1.25;
  return 1.0;
};

export const spawnMarketEvent = (state: GameState) => {
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

export const triggerMarketEvent = (state: GameState) => {
  const ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
  state.marketNews = ev.name;
  state.marketNewsMult = ev.type === 'festival' ? 1.2 : 1;
  state.marketNewsTimer = ev.duration;
  if (ev.type === 'heatwave') state.eventWaterMult = 1.5;
};

export const marketDrift = (state: GameState, dt: number) => {
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

export const maybeApplyRandomNews = (state: GameState, worldDt: number, pushMessage?: (s: GameState, text: string, type?: string) => void) => {
  state.marketNewsTimer = Math.max(0, (state.marketNewsTimer || 0) - worldDt);
  if (state.marketNewsTimer === 0 && state.marketNews) {
    state.marketNews = '';
    state.marketNewsMult = 1;
    state.eventWaterMult = 1;
  }
  if (state.marketNewsTimer === 0 && Math.random() < 0.01 * worldDt) {
    const ev = MARKET_NEWS[Math.floor(Math.random() * MARKET_NEWS.length)];
    state.marketNews = ev.name;
    state.marketNewsMult = ev.mult;
    state.marketNewsTimer = ev.duration;
    if (pushMessage) pushMessage(state, ev.name, 'info');
  }
};

export const currentSpawnWindowForState = currentSpawnWindow;
export const currentMaxOffersForState = currentMaxOffers;

export const cleanExpiredOffers = (state: GameState) => {
  const now = Date.now();
  state.offers = (state.offers || []).filter((o) => o.expiresAt > now);
  state.apothekenOffers = (state.apothekenOffers || []).filter((o) => o.expiresAt > now);
  state.orders = (state.orders || []).filter((o: any) => o.expiresAt > now);
};
