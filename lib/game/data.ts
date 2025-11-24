import {
  CaseConfig,
  CaseLoot,
  ConsumablePack,
  Employee,
  GlobalUpgrade,
  GrowRoom,
  Item,
  Job,
  Pest,
  PharmacyContract,
  Rarity,
  ResearchBranch,
  Strain
} from './types';

export const STAGE_LABELS = ['Keimphase', 'Vegetativ', 'VorBluete', 'Bluete', 'Finish'] as const;
export const GAME_DAY_REAL_SECONDS = 120 / 42;
export const DAYS_PER_YEAR = 365;

export const SAVE_KEY = 'cannabis_idle_farm_v2';
export const MAX_SLOTS = 100;
export const BASE_PRICE_PER_G = 2;
export const OFFER_SPAWN_MIN = 45;
export const OFFER_SPAWN_MAX = 90;
export const MAX_ACTIVE_OFFERS_BASE = 3;

export const WATER_MAX = 100;
export const WATER_START = 55;
export const WATER_DRAIN_PER_SEC = 0.6;
export const WATER_ADD_AMOUNT = 55;

export const NUTRIENT_MAX = 100;
export const NUTRIENT_START = 60;
export const NUTRIENT_DRAIN_PER_SEC = 0.35;
export const NUTRIENT_ADD_AMOUNT = 45;
export const PGR_BOOST_SEC = 60;

export const HEALTH_DECAY_DRY = 6;
export const HEALTH_DECAY_HUNGRY = 4;
export const HEALTH_RECOVER_RATE = 2;
export const QUALITY_GAIN_GOOD = 0.03;
export const QUALITY_LOSS_BAD = 0.06;
export const READY_DECAY_DELAY = 45;

export const DIFFICULTIES = {
  easy: { name: 'Leicht', growth: 1.35, pest: 0.7 },
  normal: { name: 'Normal', growth: 1.15, pest: 1.0 },
  hard: { name: 'Schwer', growth: 0.95, pest: 9.0 }
} as const;

export const PEST_GLOBAL_RATE = 0.25;

export const EXTRA_PESTS: Record<string, Pest> = {
  root_rot: { id: 'root_rot', name: 'Wurzelfaeule', icon: 'RR', base: 0.006, effect: { growth: 0.4, health: -2.5, quality: -0.02 } },
  leaf_rot: { id: 'leaf_rot', name: 'Faule Blaetter', icon: 'FB', base: 0.008, effect: { growth: 0.7, health: -1.8, quality: -0.015 } }
};

export const STRAINS: Strain[] = [
  { id: 'gelato', name: 'Green Gelato', tag: 'GG', rarity: 'common', cost: 60, yield: 60, grow: 120, quality: 1, yieldBonus: 0, offerBonus: 1, desc: 'Schnell und aromatisch', base: '/assets/plants/greengelato', stages: ['wachstum0', 'wachstum1', 'wachstum2', 'wachstum3', 'wachstum4', 'ende'] },
  { id: 'honey', name: 'Honey Cream', tag: 'HC', rarity: 'common', cost: 140, yield: 100, grow: 138, quality: 1.03, yieldBonus: 0.01, offerBonus: 1.01, desc: 'Cremige Indica mit Honignoten' },
  { id: 'citrusBud', name: 'Citrus Bud', tag: 'CB', rarity: 'common', cost: 220, yield: 140, grow: 156, quality: 1.06, yieldBonus: 0.03, offerBonus: 1.03, desc: 'Spritzige Citrus-Noten, schnell erntereif' },
  { id: 'mintCookie', name: 'Mint Cookie', tag: 'MC', rarity: 'common', cost: 300, yield: 180, grow: 174, quality: 1.09, yieldBonus: 0.04, offerBonus: 1.04, desc: 'Frische Minze trifft auf sanfte Süße' },
  { id: 'sunsetAuto', name: 'Sunset Auto', tag: 'SA', rarity: 'common', cost: 380, yield: 220, grow: 192, quality: 1.12, yieldBonus: 0.06, offerBonus: 1.06, desc: 'Robuste Autoflower für entspannte Abende' },
  { id: 'berryBloom', name: 'Berry Bloom', tag: 'BBM', rarity: 'common', cost: 460, yield: 260, grow: 210, quality: 1.15, yieldBonus: 0.07, offerBonus: 1.07, desc: 'Beerige Aromen mit dichter Blüte' },
  { id: 'herbalTonic', name: 'Herbal Tonic', tag: 'HT', rarity: 'common', cost: 540, yield: 300, grow: 228, quality: 1.18, yieldBonus: 0.09, offerBonus: 1.09, desc: 'Kräuterig-leichte Sorte für Einsteiger' },
  { id: 'chocoChunk', name: 'Choco Chunk', tag: 'CC', rarity: 'common', cost: 620, yield: 340, grow: 246, quality: 1.21, yieldBonus: 0.1, offerBonus: 1.1, desc: 'Schokoladiger Duft bei kurzer Blütezeit' },
  { id: 'zushi', name: 'Blue Zushi', tag: 'BZ', rarity: 'uncommon', cost: 700, yield: 260, grow: 210, quality: 1.12, yieldBonus: 0.08, offerBonus: 1.08, desc: 'Frischer Hybrid mit kühlem Finish' },
  { id: 'amnesia', name: 'Amnesia', tag: 'AM', rarity: 'uncommon', cost: 840, yield: 320, grow: 228, quality: 1.16, yieldBonus: 0.1, offerBonus: 1.1, desc: 'Klassische Sativa mit klarer Wirkung' },
  { id: 'gorilla', name: 'Gorilla Glue', tag: 'GL', rarity: 'uncommon', cost: 980, yield: 380, grow: 246, quality: 1.19, yieldBonus: 0.12, offerBonus: 1.12, desc: 'Klebriger Harzchampion' },
  { id: 'cheese', name: 'Cheese', tag: 'CH', rarity: 'uncommon', cost: 1120, yield: 440, grow: 264, quality: 1.23, yieldBonus: 0.14, offerBonus: 1.14, desc: 'Pikant, herzhaft und pflegeleicht' },
  { id: 'bubbleGum', name: 'Bubble Gum', tag: 'BG', rarity: 'uncommon', cost: 1260, yield: 500, grow: 282, quality: 1.26, yieldBonus: 0.16, offerBonus: 1.16, desc: 'Süß wie Kaugummi mit stabilem Wuchs' },
  { id: 'candyNova', name: 'Candy Nova', tag: 'CN', rarity: 'uncommon', cost: 1400, yield: 560, grow: 300, quality: 1.3, yieldBonus: 0.18, offerBonus: 1.18, desc: 'Bonbon-süße Blüten für mehr Ertrag' },
  { id: 'arcticBerry', name: 'Arctic Berry', tag: 'AB', rarity: 'uncommon', cost: 1540, yield: 620, grow: 318, quality: 1.33, yieldBonus: 0.2, offerBonus: 1.2, desc: 'Kühle Beerennoten mit Frost-Look' },
  { id: 'emeraldWave', name: 'Emerald Wave', tag: 'EW', rarity: 'uncommon', cost: 1680, yield: 680, grow: 336, quality: 1.37, yieldBonus: 0.22, offerBonus: 1.22, desc: 'Smaragdgrüner Hybrid mit Balance' },
  { id: 'jungleJuice', name: 'Jungle Juice', tag: 'JJ', rarity: 'uncommon', cost: 1820, yield: 740, grow: 354, quality: 1.4, yieldBonus: 0.24, offerBonus: 1.24, desc: 'Tropischer Mix mit hoher Resistenz' },
  { id: 'cocoaNebula', name: 'Cocoa Nebula', tag: 'CNB', rarity: 'uncommon', cost: 1960, yield: 800, grow: 372, quality: 1.44, yieldBonus: 0.26, offerBonus: 1.26, desc: 'Kakao-Aroma mit bunten Trichomen' },
  { id: 'zkittlez', name: 'Zkittlez', tag: 'ZK', rarity: 'rare', cost: 2100, yield: 520, grow: 260, quality: 1.3, yieldBonus: 0.16, offerBonus: 1.15, desc: 'Regenbogen an Fruchtaromen' },
  { id: 'purpleHaze', name: 'Purple Haze', tag: 'PH', rarity: 'rare', cost: 2280, yield: 600, grow: 280, quality: 1.34, yieldBonus: 0.19, offerBonus: 1.18, desc: 'Legendäre Haze mit violetter Optik' },
  { id: 'whiteWidow', name: 'White Widow', tag: 'WW', rarity: 'rare', cost: 2460, yield: 680, grow: 300, quality: 1.38, yieldBonus: 0.22, offerBonus: 1.21, desc: 'Kristallbesetzte Klassikerin' },
  { id: 'northernLights', name: 'Northern Lights', tag: 'NL', rarity: 'rare', cost: 2640, yield: 760, grow: 320, quality: 1.42, yieldBonus: 0.25, offerBonus: 1.24, desc: 'Robuste Indica mit schnelllem Finish' },
  { id: 'sourDiesel', name: 'Sour Diesel', tag: 'SD', rarity: 'rare', cost: 2820, yield: 840, grow: 340, quality: 1.46, yieldBonus: 0.28, offerBonus: 1.27, desc: 'Energischer Sativa-Kick' },
  { id: 'blueDream', name: 'Blue Dream', tag: 'BD', rarity: 'rare', cost: 3000, yield: 920, grow: 360, quality: 1.5, yieldBonus: 0.31, offerBonus: 1.3, desc: 'Berühmter Hybrid für Allrounder' },
  { id: 'amnesiaLemon', name: 'Amnesia Lemon', tag: 'AL', rarity: 'rare', cost: 3180, yield: 1000, grow: 380, quality: 1.54, yieldBonus: 0.34, offerBonus: 1.33, desc: 'Zitronige Wachmacherin' },
  { id: 'jackHerer', name: 'Jack Herer', tag: 'JH', rarity: 'rare', cost: 3360, yield: 1080, grow: 400, quality: 1.58, yieldBonus: 0.37, offerBonus: 1.36, desc: 'Sativa-Legende zu Ehren des Aktivisten' },
  { id: 'royalCitrus', name: 'Royal Citrus', tag: 'RC', rarity: 'rare', cost: 3540, yield: 1160, grow: 420, quality: 1.62, yieldBonus: 0.4, offerBonus: 1.39, desc: 'Krönung aus Orange und Limette' },
  { id: 'cobaltRush', name: 'Cobalt Rush', tag: 'CR', rarity: 'rare', cost: 3720, yield: 1240, grow: 440, quality: 1.66, yieldBonus: 0.43, offerBonus: 1.42, desc: 'Blauer Schimmer mit kraftvollem Punch' },
  { id: 'scarletNova', name: 'Scarlet Nova', tag: 'SN', rarity: 'rare', cost: 3900, yield: 1320, grow: 460, quality: 1.7, yieldBonus: 0.46, offerBonus: 1.45, desc: 'Rote Blüten mit feurigem Profil' },
  { id: 'girlScoutCookies', name: 'Girl Scout Cookies', tag: 'GSC', rarity: 'epic', cost: 3600, yield: 780, grow: 320, quality: 1.45, yieldBonus: 0.24, offerBonus: 1.22, desc: 'Süßer Indica-dominanter Bestseller' },
  { id: 'superSilverHaze', name: 'Super Silver Haze', tag: 'SSH', rarity: 'epic', cost: 3820, yield: 875, grow: 342, quality: 1.49, yieldBonus: 0.28, offerBonus: 1.26, desc: 'Premium-Haze für Profis' },
  { id: 'ogKush', name: 'OG Kush', tag: 'OG', rarity: 'epic', cost: 4040, yield: 970, grow: 364, quality: 1.54, yieldBonus: 0.32, offerBonus: 1.3, desc: 'Erdiges OG-Original' },
  { id: 'trainwreck', name: 'Trainwreck', tag: 'TW', rarity: 'epic', cost: 4260, yield: 1065, grow: 386, quality: 1.58, yieldBonus: 0.36, offerBonus: 1.34, desc: 'Stürmische Sativa voller Energie' },
  { id: 'criticalMass', name: 'Critical Mass', tag: 'CM', rarity: 'epic', cost: 4480, yield: 1160, grow: 408, quality: 1.63, yieldBonus: 0.4, offerBonus: 1.38, desc: 'Schwere Buds mit Monsterertrag' },
  { id: 'bigBud', name: 'Big Bud', tag: 'BGB', rarity: 'epic', cost: 4700, yield: 1255, grow: 430, quality: 1.67, yieldBonus: 0.44, offerBonus: 1.42, desc: 'Gigantische Blüten, wenig Aufwand' },
  { id: 'masterKush', name: 'Master Kush', tag: 'MK', rarity: 'epic', cost: 4920, yield: 1350, grow: 452, quality: 1.72, yieldBonus: 0.48, offerBonus: 1.46, desc: 'Meisterliche Kush-Power' },
  { id: 'lemonHaze', name: 'Lemon Haze', tag: 'LH', rarity: 'epic', cost: 5140, yield: 1445, grow: 474, quality: 1.76, yieldBonus: 0.52, offerBonus: 1.5, desc: 'Spritzige Zitrusnote mit Kick' },
  { id: 'afghanKush', name: 'Afghan Kush', tag: 'AK', rarity: 'epic', cost: 5360, yield: 1540, grow: 496, quality: 1.81, yieldBonus: 0.56, offerBonus: 1.54, desc: 'Gebirgs-Indica mit Harzgarantie' },
  { id: 'emberQueen', name: 'Ember Queen', tag: 'EQ', rarity: 'epic', cost: 5580, yield: 1635, grow: 518, quality: 1.85, yieldBonus: 0.6, offerBonus: 1.58, desc: 'Feurige Königin mit rubinroten Buds' },
  { id: 'frostedFuel', name: 'Frosted Fuel', tag: 'FF', rarity: 'epic', cost: 5800, yield: 1730, grow: 540, quality: 1.9, yieldBonus: 0.64, offerBonus: 1.62, desc: 'Dieselpower mit Frost-Layer' },
  { id: 'templeLotus', name: 'Temple Lotus', tag: 'TL', rarity: 'epic', cost: 6020, yield: 1825, grow: 562, quality: 1.94, yieldBonus: 0.68, offerBonus: 1.66, desc: 'Meditativer Hybrid mit Blumenduft' },
  { id: 'gorillaGlue', name: 'Gorilla Glue #4', tag: 'GG4', rarity: 'legendary', cost: 6200, yield: 1100, grow: 360, quality: 1.6, yieldBonus: 0.35, offerBonus: 1.3, desc: 'Ultra-harzige Potenzlegende' },
  { id: 'amnesiaHaze', name: 'Amnesia Haze', tag: 'AHZ', rarity: 'legendary', cost: 6680, yield: 1220, grow: 385, quality: 1.65, yieldBonus: 0.4, offerBonus: 1.35, desc: 'Intensiver Klassiker mit Euphorie' },
  { id: 'blueZushi', name: 'Blue Zushi', tag: 'BZ2', rarity: 'legendary', cost: 7160, yield: 1340, grow: 410, quality: 1.7, yieldBonus: 0.45, offerBonus: 1.4, desc: 'Luxus-Hybrid in Tiefblau' },
  { id: 'honeyCream', name: 'Honey Cream Reserve', tag: 'HCR', rarity: 'legendary', cost: 7640, yield: 1460, grow: 435, quality: 1.75, yieldBonus: 0.5, offerBonus: 1.45, desc: 'Veredelter Honiggeschmack' },
  { id: 'durbanPoison', name: 'Durban Poison', tag: 'DP', rarity: 'legendary', cost: 8120, yield: 1580, grow: 460, quality: 1.8, yieldBonus: 0.55, offerBonus: 1.5, desc: 'Reine Sativa aus Südafrika' },
  { id: 'hinduKush', name: 'Hindu Kush', tag: 'HK', rarity: 'legendary', cost: 8600, yield: 1700, grow: 485, quality: 1.85, yieldBonus: 0.6, offerBonus: 1.55, desc: 'Himalaya-Genetik mit Ruhepol' },
  { id: 'nepaleseJam', name: 'Nepalese Jam', tag: 'NJ', rarity: 'legendary', cost: 9080, yield: 1820, grow: 510, quality: 1.9, yieldBonus: 0.65, offerBonus: 1.6, desc: 'Süße Jam-Noten aus Nepal' },
  { id: 'pakistaniChitral', name: 'Pakistani Chitral', tag: 'PC', rarity: 'legendary', cost: 9560, yield: 1940, grow: 535, quality: 1.95, yieldBonus: 0.7, offerBonus: 1.65, desc: 'Seltene Chitral-Genetik' },
  { id: 'thaiStick', name: 'Thai Stick', tag: 'TS', rarity: 'legendary', cost: 10040, yield: 2060, grow: 560, quality: 2, yieldBonus: 0.75, offerBonus: 1.7, desc: 'Fernöstlicher Klassiker' },
  { id: 'malawiGold', name: 'Malawi Gold', tag: 'MG', rarity: 'legendary', cost: 10520, yield: 2180, grow: 585, quality: 2, yieldBonus: 0.8, offerBonus: 1.75, desc: 'Goldene Premium-Sativa' },
  { id: 'dragonBreath', name: 'Dragon Breath', tag: 'DB', rarity: 'legendary', cost: 11000, yield: 2300, grow: 610, quality: 2, yieldBonus: 0.85, offerBonus: 1.8, desc: 'Mythischer Rauch mit Hitze' },
  { id: 'zenithStar', name: 'Zenith Star', tag: 'ZS', rarity: 'legendary', cost: 11480, yield: 2420, grow: 635, quality: 2, yieldBonus: 0.9, offerBonus: 1.85, desc: 'Strahlende Spitzenzüchtung' },
  { id: 'mythicMuse', name: 'Mythic Muse', tag: 'MM', rarity: 'legendary', cost: 11960, yield: 2540, grow: 660, quality: 2, yieldBonus: 0.95, offerBonus: 1.9, desc: 'Mystische Legende für Kenner' }
];

export const GLOBAL_UPGRADES: GlobalUpgrade[] = [
  { id: 'lights', name: 'LED-Growlights', baseCost: 75, inc: 0.02, desc: 'Alle Pflanzen +2% Ertrag je Stufe' },
  { id: 'nutrients', name: 'Naehrstoff-Booster', baseCost: 180, inc: 0.025, desc: 'Alle Pflanzen +2.5% je Stufe' },
  { id: 'climate', name: 'Klimasteuerung', baseCost: 420, inc: 0.03, desc: 'Alle Pflanzen +3% je Stufe' },
  { id: 'automation', name: 'Automatisierung', baseCost: 950, inc: 0.035, desc: 'Alle Pflanzen +3.5% je Stufe' },
  { id: 'resonance', name: 'Resonanz-Soundscapes', baseCost: 1600, inc: 0.03, desc: 'Frequenz-Tuning beschleunigt Wachstum (+3% je Stufe)' },
  { id: 'biophotonics', name: 'Biophotonik-Kuppeln', baseCost: 2600, inc: 0.035, desc: 'Spektrale Lichtkuppeln +3.5% je Stufe' },
  { id: 'hydroponics', name: 'Hydroponik-System', baseCost: 3800, inc: 0.04, desc: 'Hydroponik bringt +4% je Stufe' },
  { id: 'genetics', name: 'Genetische Optimierung', baseCost: 5200, inc: 0.04, desc: 'Qualitaetsboost +4% je Stufe' },
  { id: 'pest_control', name: 'Schaedlingsbekaempfung', baseCost: 7200, inc: 0.025, desc: 'Schaedlingsrisiko sinkt (effektiv +2.5% je Stufe)' },
  { id: 'yield_enhancer', name: 'Ertragsverstaerker', baseCost: 9500, inc: 0.045, desc: 'Ertrag +4.5% je Stufe' },
  { id: 'growth_accelerator', name: 'Wachstumsbeschleuniger', baseCost: 12000, inc: 0.035, desc: 'Wachstum +3.5% je Stufe' },
  { id: 'premium_lights', name: 'Premium-Beleuchtung', baseCost: 15500, inc: 0.04, desc: 'Ertrag +4% je Stufe' },
  { id: 'ai_optimization', name: 'KI-Optimierung', baseCost: 19000, inc: 0.045, desc: 'Alle Effekte +4.5% je Stufe' },
  { id: 'quantum_tech', name: 'Quanten-Technologie', baseCost: 23000, inc: 0.05, desc: 'Ertrag +5% je Stufe' },
  { id: 'ultimate_boost', name: 'Ultimativer Boost', baseCost: 28000, inc: 0.055, desc: 'Alle Boni +5.5% je Stufe' }
];

export const ITEMS: Item[] = [
  { id: 'shears', name: 'Schere', icon: 'SC', cost: 80, desc: 'Zum Ernten erforderlich', category: 'tools', effects: {} },
  { id: 'nutrients', name: 'Duenger-Set', icon: 'DN', cost: 110, desc: 'Zum Fuettern erforderlich', category: 'tools', effects: {} },
  { id: 'scale', name: 'Praezisionswaage', icon: 'SW', cost: 150, desc: '+5% Verkaufspreis', category: 'commerce', effects: { priceMult: 1.05 } },
  { id: 'jars', name: 'Curing-Glaeser', icon: 'JG', cost: 300, desc: '+10% Verkaufspreis', category: 'commerce', effects: { priceMult: 1.1 } },
  { id: 'van', name: 'Lieferwagen', icon: 'LV', cost: 600, desc: '+1 Anfrage, -10s Spawn', category: 'commerce', effects: { offerSlot: 1, spawnDelta: 10 } },
  { id: 'trimmer', name: 'Trimmer', icon: 'TR', cost: 500, desc: '+5% Pflanzenertrag', category: 'equipment', effects: { yieldMult: 1.05 } },
  { id: 'filter', name: 'Carbon-Filter', icon: 'CF', cost: 350, desc: '+5% Pflanzenertrag', category: 'equipment', effects: { yieldMult: 1.05 } },
  { id: 'fan', name: 'Ventilator', icon: 'VF', cost: 220, desc: 'Reduziert Schimmelrisiko', category: 'equipment', effects: { pestReduce: { mold: 0.6 } } },
  { id: 'dehumidifier', name: 'Entfeuchter', icon: 'DH', cost: 280, desc: 'Reduziert Feuchte & Schimmel', category: 'equipment', effects: { pestReduce: { mold: 0.5 } } },
  { id: 'sticky_traps', name: 'Gelbtafeln', icon: 'GT', cost: 120, desc: 'Reduziert Thripse', category: 'pest', effects: { pestReduce: { thrips: 0.5 } } },
  { id: 'humidifier', name: 'Luftbefeuchter', icon: 'HB', cost: 260, desc: 'Stabilisiert Klima, weniger Schimmel', category: 'equipment', effects: { pestReduce: { mold: 0.8 } } },
  { id: 'irrigation', name: 'Bewaesserungssystem', icon: 'IR', cost: 700, desc: '+5% Pflanzenertrag', category: 'equipment', effects: { yieldMult: 1.05 } },
  { id: 'ph_meter', name: 'pH-Meter', icon: 'PH', cost: 180, desc: '+5% Pflanzenertrag', category: 'tools', effects: { yieldMult: 1.05 } },
  { id: 'thermometer', name: 'Thermometer', icon: 'TM', cost: 90, desc: 'Leicht besseres Klima', category: 'equipment', effects: { pestReduce: { mold: 0.95, thrips: 0.95 } } },
  { id: 'soundscape', name: 'Soundscape-System', icon: 'SS', cost: 620, desc: 'Beruhigt Pflanzen, +4% Pflanzenertrag', category: 'equipment', effects: { yieldMult: 1.04 } },
  { id: 'aero_drone', name: 'Aero-Drone', icon: 'AD', cost: 820, desc: 'Autonomes Pflegen, +5% Pflanzenertrag', category: 'equipment', effects: { yieldMult: 1.05 } },
  { id: 'brand_wall', name: 'Markengalerie', icon: 'HW', cost: 1100, desc: '+12% Verkaufspreis', category: 'commerce', effects: { priceMult: 1.12 } },
  { id: 'genetic_analyzer', name: 'Genetischer Analyzer', icon: 'GA', cost: 1500, desc: 'Verbessert Kreuzungserfolge', category: 'tools', effects: {} },
  { id: 'hydro_system', name: 'Hydroponik-System', icon: 'HS', cost: 2000, desc: '+10% Pflanzenertrag', category: 'equipment', effects: { yieldMult: 1.1 } },
  { id: 'led_panel', name: 'LED-Panel', icon: 'LP', cost: 1800, desc: 'Beschleunigt Wachstum', category: 'equipment', effects: { growthMult: 1.15 } },
  { id: 'co2_generator', name: 'CO2-Generator', icon: 'CO2', cost: 2500, desc: '+15% Pflanzenertrag', category: 'equipment', effects: { yieldMult: 1.15 } },
  { id: 'pest_trap', name: 'Schädlingsfalle', icon: 'PT', cost: 1600, desc: 'Reduziert Schädlinge', category: 'equipment', effects: { pestReduce: { mites: 0.3, thrips: 0.3 } } },
  { id: 'soil_tester', name: 'Boden-Tester', icon: 'ST', cost: 1300, desc: 'Verbessert Nährstoffaufnahme', category: 'tools', effects: { nutrientBoost: 0.1 } },
  { id: 'grow_tent', name: 'Grow-Zelt', icon: 'GT', cost: 3000, desc: '+20% Pflanzenertrag', category: 'equipment', effects: { yieldMult: 1.2 } },
  { id: 'extraction_machine', name: 'Extraktionsmaschine', icon: 'EM', cost: 4000, desc: '+25% Verkaufspreis', category: 'equipment', effects: { priceMult: 1.25 } },
  { id: 'plasma_lantern', name: 'Plasma-Lantern', icon: 'PL', cost: 5200, desc: 'Pulslicht +12% Wachstum', category: 'equipment', effects: { growthMult: 1.12 } },
  { id: 'quantum_rootnet', name: 'Quantum Rootnet', icon: 'QR', cost: 4400, desc: 'Sensorwurzelnetz +12% Ertrag, +5% Qualitaet', category: 'equipment', effects: { yieldMult: 1.12, qualityMult: 1.05 } },
  { id: 'ion_shower', name: 'Ionendusche', icon: 'IS', cost: 4800, desc: 'Erlebnisverkauf +18% Preis', category: 'equipment', effects: { priceMult: 1.18 } },
  { id: 'lunar_timer', name: 'Lunar-Timer', icon: 'LT', cost: 950, desc: 'Mondphasen-Timing +8% Wachstum', category: 'tools', effects: { growthMult: 1.08 } },
  { id: 'bio_sentry', name: 'Bio-Sentry', icon: 'BS', cost: 2900, desc: 'Bio-Scanner -40% Schaedlinge', category: 'equipment', effects: { pestReduce: { mites: 0.4, thrips: 0.4, mold: 0.35 } } }
];

export const PESTS: Pest[] = [
  { id: 'mites', name: 'Spinnmilben', icon: '🕷️', base: 0.02, effect: { growth: 0.6, health: -2, quality: -0.01 }, prefers: 'dry' },
  { id: 'mold', name: 'Schimmel', icon: '🦠', base: 0.015, effect: { growth: 0.3, health: -3, quality: -0.03 }, prefers: 'wet' },
  { id: 'thrips', name: 'Thripse', icon: '🐛', base: 0.018, effect: { growth: 0.8, health: -1, quality: -0.008 }, prefers: 'any' }
];

export const RESEARCH_TREE: Record<string, ResearchBranch> = {
  botany: {
    name: 'Botanik',
    icon: '🌿',
    nodes: {
      start_botany: { name: 'Grundlagen der Botanik', desc: 'Schaltet den Botanik-Zweig frei.', cost: 0, requires: [], position: { x: 50, y: 0 } },
      yield_1: { name: 'Ertragssteigerung I', desc: '+10% Ertrag für alle Pflanzen.', cost: 1, effects: { yield: 0.1 }, requires: ['start_botany'], position: { x: 50, y: 100 } },
      quality_1: { name: 'Qualitätsverbesserung I', desc: '+5% Qualität für alle Pflanzen.', cost: 1, effects: { quality: 0.05 }, requires: ['start_botany'], position: { x: 150, y: 100 } },
      yield_2: { name: 'Ertragssteigerung II', desc: '+15% Ertrag für alle Pflanzen.', cost: 3, effects: { yield: 0.15 }, requires: ['yield_1'], position: { x: 50, y: 200 } },
      quality_2: { name: 'Qualitätsverbesserung II', desc: '+10% Qualität für alle Pflanzen.', cost: 3, effects: { quality: 0.1 }, requires: ['quality_1'], position: { x: 150, y: 200 } },
      genetics: { name: 'Genetische Optimierung', desc: 'Schaltet die Möglichkeit frei, Samen zu verbessern.', cost: 5, effects: { unlock_genetics: true }, requires: ['yield_2', 'quality_2'], position: { x: 100, y: 300 } }
    }
  },
  training: {
    name: 'Training',
    icon: '✂️',
    nodes: {
      start_training: { name: 'Pflanzentraining', desc: 'Schaltet den Trainings-Zweig frei.', cost: 1, requires: [], position: { x: 350, y: 0 } },
      lst: { name: 'Low Stress Training (LST)', desc: 'Biege deine Pflanzen für mehr Ertrag. +15% Ertrag, +5% Wachstumszeit.', cost: 2, effects: { yield: 0.15, growthTime: 0.05 }, requires: ['start_training'], position: { x: 300, y: 100 } },
      hst: { name: 'High Stress Training (HST)', desc: 'Beschneide deine Pflanzen für höhere Qualität. +15% Qualität, +10% Wachstumszeit.', cost: 2, effects: { quality: 0.15, growthTime: 0.1 }, requires: ['start_training'], position: { x: 400, y: 100 } },
      scrog: { name: 'Screen of Green (SCROG)', desc: 'Optimiere die Lichtverteilung. +20% Ertrag.', cost: 4, effects: { yield: 0.2 }, requires: ['lst'], position: { x: 300, y: 200 } },
      supercropping: { name: 'Supercropping', desc: 'Kontrollierter Stress für maximale Potenz. +20% Qualität.', cost: 4, effects: { quality: 0.2 }, requires: ['hst'], position: { x: 400, y: 200 } },
      mainlining: { name: 'Main-Lining', desc: 'Extreme Form des HST für gleichmäßige, große Colas. +25% Ertrag und +15% Qualität, +20% Wachstumszeit.', cost: 6, effects: { yield: 0.25, quality: 0.15, growthTime: 0.2 }, requires: ['scrog', 'supercropping'], position: { x: 350, y: 300 } }
    }
  },
  equipment: {
    name: 'Ausrüstung',
    icon: '💡',
    nodes: {
      start_equipment: { name: 'Ausrüstungs-Upgrades', desc: 'Schaltet den Ausrüstungs-Zweig frei.', cost: 1, requires: [], position: { x: 600, y: 0 } },
      lights_1: { name: 'Bessere Lampen', desc: '+10% Wachstum.', cost: 2, effects: { growth: 0.1 }, requires: ['start_equipment'], position: { x: 550, y: 100 } },
      ventilation_1: { name: 'Bessere Lüftung', desc: '-15% Schädlingsrisiko.', cost: 2, effects: { pest: 0.15 }, requires: ['start_equipment'], position: { x: 650, y: 100 } },
      hydroponics: { name: 'Hydroponik', desc: 'Pflanzen wachsen in Nährlösung. +30% Wachstum, -100% Wasserverbrauch, aber +50% Düngekosten.', cost: 5, effects: { growth: 0.3, water: 1.0, nutrientCost: 0.5 }, requires: ['lights_1', 'ventilation_1'], position: { x: 600, y: 200 } }
    }
  },
  economy: {
    name: 'Wirtschaft',
    icon: '💰',
    nodes: {
      start_economy: { name: 'Wirtschafts-Wissen', desc: 'Schaltet den Wirtschafts-Zweig frei.', cost: 1, requires: [], position: { x: 850, y: 0 } },
      prices_1: { name: 'Bessere Preise I', desc: '+10% auf alle Verkäufe.', cost: 2, effects: { priceMult: 0.1 }, requires: ['start_economy'], position: { x: 800, y: 100 } },
      costs_1: { name: 'Kosten senken I', desc: '-15% auf alle Einkäufe im Shop.', cost: 2, effects: { cost: 0.15 }, requires: ['start_economy'], position: { x: 900, y: 100 } },
      dealer: { name: 'Dealer-Netzwerk', desc: 'Schaltet neue, lukrativere Aufträge frei.', cost: 5, effects: { unlock_dealer: true }, requires: ['prices_1', 'costs_1'], position: { x: 850, y: 200 } }
    }
  }
};

export const GROW_ROOMS: GrowRoom[] = [
  { id: 'closet', name: 'Abstellkammer', slots: 2, cost: 0, exhaust: false, moldRisk: 1.6, desc: 'Kleiner Raum für Anfänger, keine Abluft.' },
  { id: 'room', name: 'Zimmer (Fenster)', slots: 4, cost: 1200, exhaust: true, moldRisk: 1.2, desc: 'Gemütliches Zimmer mit natürlicher Belüftung.' },
  { id: 'basement', name: 'Kellerraeume', slots: 6, cost: 3500, exhaust: true, moldRisk: 1.0, desc: 'Kühle Kellerraeume mit guter Isolierung.' },
  { id: 'garage', name: 'Garage', slots: 8, cost: 8000, exhaust: true, moldRisk: 0.95, desc: 'Große Garage für mittlere Operationen.' },
  { id: 'warehouse', name: 'Lagerhalle', slots: 12, cost: 20000, exhaust: true, moldRisk: 0.9, desc: 'Professionelle Lagerhalle mit Abluftsystem.' },
  { id: 'bigwarehouse', name: 'Großlager', slots: 16, cost: 45000, exhaust: true, moldRisk: 0.85, desc: 'Erweiterte Lagerhalle für mehr Pflanzen.' },
  { id: 'factory', name: 'Fabrik', slots: 20, cost: 80000, exhaust: true, moldRisk: 0.8, desc: 'Industrielle Fabrik mit automatischer Klimakontrolle.' },
  { id: 'megafarm', name: 'Mega-Farm', slots: 30, cost: 150000, exhaust: true, moldRisk: 0.75, desc: 'Massive Farm für Großproduktion.' },
  { id: 'hyperfarm', name: 'Hyper-Farm', slots: 50, cost: 300000, exhaust: true, moldRisk: 0.7, desc: 'Hochtechnologische Hyper-Farm.' },
  { id: 'ultrafarm', name: 'Ultra-Farm', slots: 75, cost: 600000, exhaust: true, moldRisk: 0.65, desc: 'Ultimative Farm mit maximaler Effizienz.' },
  { id: 'supremefarm', name: 'Supreme-Farm', slots: 100, cost: 1000000, exhaust: true, moldRisk: 0.6, desc: 'Die Supreme Farm für unbegrenzte Möglichkeiten.' }
];

export const EMPLOYEES: Employee[] = [
  { id: 'grower', name: 'Grower', desc: 'Automatisiert Wässern und Düngen', salary: 200, tasks: ['water', 'feed'], reqLevel: 2, image: 'https://via.placeholder.com/80x80/00c16a/ffffff?text=GROWER' },
  { id: 'caretaker', name: 'Caretaker', desc: 'Behandelt Schädlinge automatisch', salary: 250, tasks: ['treat'], reqLevel: 5, image: 'https://via.placeholder.com/80x80/00c16a/ffffff?text=CARETAKER' },
  { id: 'harvester', name: 'Harvester', desc: 'Automatisiert Ernten', salary: 300, tasks: ['harvest'], reqLevel: 8, image: 'https://via.placeholder.com/80x80/00c16a/ffffff?text=HARVESTER' }
];

export const APOTHEKEN_VERTRAEGE: PharmacyContract[] = [
  { id: 'small_pharmacy', name: 'Kleine Apotheke', desc: 'Liefert 50g pro Monat für 500 Münzen', monthlyGrams: 50, monthlyCash: 500, costToHire: 2000, reqLevel: 6 },
  { id: 'medium_pharmacy', name: 'Mittlere Apotheke', desc: 'Liefert 100g pro Monat für 1000 Münzen', monthlyGrams: 100, monthlyCash: 1000, costToHire: 4000, reqLevel: 8 },
  { id: 'large_pharmacy', name: 'Große Apotheke', desc: 'Liefert 200g pro Monat für 2000 Münzen', monthlyGrams: 200, monthlyCash: 2000, costToHire: 8000, reqLevel: 10 },
  { id: 'chain_pharmacy', name: 'Apothekenkette', desc: 'Liefert 500g pro Monat für 5000 Münzen', monthlyGrams: 500, monthlyCash: 5000, costToHire: 20000, reqLevel: 12 }
];

export const CONSUMABLE_PACKS: ConsumablePack[] = [
  { id: 'nutrient_s', name: 'Duenger S', icon: 'fi fi-sr-flask', price: 5, desc: 'Einzeldosis NPK', add: { nutrient: 1 } },
  { id: 'nutrient_m', name: 'Duenger M', icon: 'fi fi-sr-flask', price: 12, desc: '3x NPK Dosen', add: { nutrient: 3 } },
  { id: 'nutrient_l', name: 'Duenger L', icon: 'fi fi-sr-flask', price: 22, desc: '6x NPK Dosen', add: { nutrient: 6 } },
  { id: 'pgr_boost', name: 'PGR-Booster', icon: 'fi fi-sr-bolt', price: 18, desc: 'Wachstum +, Qualitaet leicht -', add: { pgr: 1 } },
  { id: 'pk_boost', name: 'PK-Boost', icon: 'fi fi-sr-rocket', price: 14, desc: 'Bluete-Unterstuetzung', add: { nutrient: 2 } },
  { id: 'micro_tea', name: 'Mikroben-Tee', icon: 'fi fi-sr-plant', price: 10, desc: 'Bodenleben foerdern', add: { nutrient: 1 } },
  { id: 'micro_bio', name: 'Bio-Elixier', icon: 'fi fi-sr-flower-tulip', price: 26, desc: '2x NPK + 1x Booster', add: { nutrient: 2, pgr: 1 } },
  { id: 'spray_s', name: 'Pflanzenspray S', icon: 'fi fi-sr-bug', price: 9, desc: '1x gegen Insekten', add: { spray: 1 } },
  { id: 'spray_m', name: 'Pflanzenspray M', icon: 'fi fi-sr-bug', price: 24, desc: '3x gegen Insekten', add: { spray: 3 } },
  { id: 'fungi_s', name: 'Fungizid S', icon: 'fi fi-sr-shield-plus', price: 11, desc: '1x gegen Schimmel', add: { fungicide: 1 } },
  { id: 'fungi_m', name: 'Fungizid M', icon: 'fi fi-sr-shield-plus', price: 30, desc: '3x gegen Schimmel', add: { fungicide: 3 } },
  { id: 'beneficial_s', name: 'Nuetzlinge S', icon: 'fi fi-sr-leaf', price: 14, desc: '1x biologische Abwehr', add: { beneficials: 1 } },
  { id: 'beneficial_m', name: 'Nuetzlinge M', icon: 'fi fi-sr-leaf', price: 36, desc: '3x biologische Abwehr', add: { beneficials: 3 } }
];

export const JOBS: Job[] = [
  { id: 'runner', name: 'Straßenrunner', salary: 140, base: 0.82, reqLevel: 1, desc: 'Verteilt Flyer und Samples in der Nachbarschaft.' },
  { id: 'assistant', name: 'Shop-Assistent', salary: 180, base: 0.78, reqLevel: 1, desc: 'Hilft im Headshop, kümmert sich um Kunden und Kasse.' },
  { id: 'growhelper', name: 'Grow-Helfer', salary: 220, base: 0.74, reqLevel: 2, desc: 'Unterstützt beim Umtopfen, Bewässern und Trimmen der Pflanzen.' },
  { id: 'delivery', name: 'Lieferfahrer', salary: 260, base: 0.7, reqLevel: 2, desc: 'Bringt Bestellungen schnell und diskret zu Stammkunden.' },
  { id: 'barista', name: 'Café Barista', salary: 300, base: 0.66, reqLevel: 3, desc: 'Bereitet infused Drinks und Snacks im Coffeeshop zu.' },
  { id: 'labtech', name: 'Labor-Assistent', salary: 360, base: 0.62, reqLevel: 3, desc: 'Überwacht Extrakte und dokumentiert Messwerte im Labor.' },
  { id: 'consultant', name: 'Grow Consultant', salary: 420, base: 0.58, reqLevel: 4, desc: 'Berät Kundschaft zu Sortenwahl, Setup und Pflege.' },
  { id: 'deliverylead', name: 'Lieferkoordinator', salary: 480, base: 0.54, reqLevel: 5, desc: 'Plant Touren, weist Fahrer ein und verwaltet Lagerbestände.' },
  { id: 'manager', name: 'Store Manager', salary: 620, base: 0.5, reqLevel: 6, desc: 'Führt das Team, organisiert Schichten und sorgt für Umsatz.' },
  { id: 'operations', name: 'Operations Lead', salary: 780, base: 0.44, reqLevel: 7, desc: 'Optimiert Produktion, Einkauf und Qualitätskontrolle.' },
  { id: 'chemist', name: 'Extrakt-Chemiker', salary: 960, base: 0.38, reqLevel: 8, desc: 'Entwickelt neue Konzentrate und stellt Reinheit sicher.' },
  { id: 'marketing', name: 'Marketing Director', salary: 1200, base: 0.32, reqLevel: 9, desc: 'Plant Kampagnen, Social Media und Events.' },
  { id: 'finance', name: 'Finanzmanager', salary: 1500, base: 0.26, reqLevel: 10, desc: 'Betreut Buchhaltung, Forecasts und Investoren.' },
  { id: 'globalbuyer', name: 'Internationaler Einkäufer', salary: 1900, base: 0.22, reqLevel: 11, desc: 'Sichert rare Genetik und knüpft internationale Kontakte.' },
  { id: 'executive', name: 'Chief Growth Officer', salary: 2400, base: 0.18, reqLevel: 12, desc: 'Setzt langfristige Expansionsstrategie und Partnerschaften um.' }
];

export const CASE_RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const CASE_RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
};

export const CASE_LOOT_BASE_WEIGHT: Record<Rarity, number> = {
  common: 520,
  uncommon: 320,
  rare: 180,
  epic: 90,
  legendary: 35
};

export const CASE_REEL_BEFORE = 56;
export const CASE_REEL_AFTER = 30;
export const CASE_SPIN_FAST_DURATION = 1500;
export const CASE_SPIN_SLOW_MIN = 5400;
export const CASE_SPIN_SLOW_MAX = 6600;

export interface BuildCaseLootOptions {
  rarities?: Rarity[];
  includeIds?: string[] | null;
  excludeIds?: string[];
  weightFactor?: number;
  limitPerRarity?: Record<string, number> | number;
  pool?: Strain[];
}

export function buildCaseLoot(options: BuildCaseLootOptions = {}): CaseLoot[] {
  const {
    rarities = CASE_RARITIES,
    includeIds = null,
    excludeIds = [],
    weightFactor = 1,
    limitPerRarity = {},
    pool = STRAINS
  } = options;
  const excludeSet = new Set(excludeIds || []);
  const includeSet = includeIds ? Array.from(new Set(includeIds)) : null;
  const baseStrainsMap = new Map(pool.map((s) => [s.id, s]));
  let source: Strain[] = [];
  if (includeSet && includeSet.length) {
    source = includeSet.map((id) => baseStrainsMap.get(id)).filter(Boolean) as Strain[];
  } else {
    source = pool.filter((strain) => rarities.includes((strain.rarity as Rarity) || 'common'));
  }
  source = source.filter((strain) => strain && !excludeSet.has(strain.id));
  const groups = new Map<Rarity, Strain[]>();
  source.forEach((strain) => {
    const rarity = (strain.rarity as Rarity) || 'common';
    if (!groups.has(rarity)) groups.set(rarity, []);
    groups.get(rarity)!.push(strain);
  });
  for (const [, list] of groups.entries()) {
    list.sort((a, b) => a.cost - b.cost);
  }
  const targetRarities = CASE_RARITIES.filter((rarity) => groups.has(rarity));
  const loot: CaseLoot[] = [];
  targetRarities.forEach((rarity) => {
    const group = groups.get(rarity) || [];
    const baseWeight = (CASE_LOOT_BASE_WEIGHT[rarity] || 30) * weightFactor;
    const rarityLimit = typeof limitPerRarity === 'number'
      ? limitPerRarity
      : (limitPerRarity && typeof limitPerRarity === 'object' ? (limitPerRarity as Record<string, number>)[rarity] ?? Infinity : Infinity);
    group.forEach((strain, index) => {
      if (index >= rarityLimit) return;
      const weight = Math.max(3, Math.round(baseWeight / (1 + index * 0.22)));
      loot.push({ strainId: strain.id, rarity, weight });
    });
  });
  return loot;
}

export function buildCaseConfigs(pool: Strain[]): CaseConfig[] {
  return [
    {
      id: 'starter',
      name: 'Starter Case',
      price: 240,
      description: 'Einsteiger-Mix aus Common- und Uncommon-Strains mit hoher Drop-Rate.',
      lootBuilder: () => buildCaseLoot({ rarities: ['common', 'uncommon'], weightFactor: 1.1, pool })
    },
    {
      id: 'grower',
      name: 'Grower Case',
      price: 420,
      description: 'Ausgewogener Mix aller Seltenheiten – ideal zum Auffüllen deiner Sammlung.',
      lootBuilder: () => buildCaseLoot({ pool })
    },
    {
      id: 'aroma',
      name: 'Aroma Case',
      price: 520,
      description: 'Fruchtige und süße Sorten aus allen Raritäten, perfekt für Geschmacksjäger.',
      lootBuilder: () => buildCaseLoot({
        includeIds: [
          'citrusBud',
          'mintCookie',
          'sunsetAuto',
          'berryBloom',
          'candyNova',
          'arcticBerry',
          'emeraldWave',
          'jungleJuice',
          'cocoaNebula',
          'zkittlez',
          'royalCitrus',
          'scarletNova',
          'lemonHaze',
          'dragonBreath'
        ],
        weightFactor: 1.05,
        pool
      })
    },
    {
      id: 'heritage',
      name: 'Heritage Case',
      price: 680,
      description: 'Seltene Klassiker und Premium-Hybriden (Rare & Epic) mit gesteigerter Qualität.',
      lootBuilder: () => buildCaseLoot({ rarities: ['rare', 'epic'], weightFactor: 0.95, pool })
    },
    {
      id: 'mythic',
      name: 'Mythic Case',
      price: 980,
      description: 'Legendäre Spitzenzüchtungen mit Chance auf deine Lieblings-Meta-Strains.',
      lootBuilder: () => buildCaseLoot({ rarities: ['legendary'], weightFactor: 0.75, pool })
    }
  ];
}
