export const TILE_SIZE = 32;

export const SPRITES = {
  PLANTS: {
    SEED: { gridX: 0, gridY: 0 },
    SPROUT: { gridX: 1, gridY: 0 },
    VEG: { gridX: 2, gridY: 0 },
    FLOWER_PURPLE: { gridX: 3, gridY: 0 },
    FLOWER_GOLD: { gridX: 4, gridY: 0 }
  },
  ITEMS: {
    POT_EMPTY: { gridX: 0, gridY: 3 },
    WATERING_CAN: { gridX: 1, gridY: 3 },
    NUTRIENT: { gridX: 2, gridY: 3 },
    SHEARS: { gridX: 3, gridY: 3 }
  }
} as const;
