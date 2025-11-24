'use client';

import { harvestYieldFor, qualityMultiplier, statusForPlant, timerForPlant } from '@/lib/game/engine';
import { NUTRIENT_MAX, WATER_MAX } from '@/lib/game/data';
import { fmtNumber, formatTimer } from '@/lib/game/utils';
import { GameState, Plant, Strain } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { SpriteIcon } from './ui/SpriteIcon';
import { SPRITES } from '@/lib/spriteConfig';

type Props = {
  plant: Plant;
  strain: Strain;
  state: GameState;
  actions: GameActions;
};

export function PlantCard({ plant, strain, state, actions }: Props) {
  const growPct = Math.round((plant.growProg || 0) * 100);
  const waterPct = Math.round(((plant.water || 0) / WATER_MAX) * 100);
  const nutrientPct = Math.round(((plant.nutrients || 0) / NUTRIENT_MAX) * 100);
  const timer = timerForPlant(state, plant);
  const statuses = statusForPlant(state, plant);
  const yieldEstimate = harvestYieldFor(state, plant) * qualityMultiplier(state, plant);
  const ready = plant.growProg >= 1;
  const stageSprite = (() => {
    const gp = plant.growProg || 0;
    if (gp < 0.2) return SPRITES.PLANTS.SEED;
    if (gp < 0.45) return SPRITES.PLANTS.SPROUT;
    if (gp < 0.8) return SPRITES.PLANTS.VEG;
    return SPRITES.PLANTS.FLOWER_PURPLE;
  })();

  return (
    <div className={`plant-card ${ready ? 'plant-card-ready' : ''}`} data-slot={plant.slot}>
      <div className="plant-header">
        <div className="plant-left">
          <div className="plant-icon">
            <SpriteIcon gridX={stageSprite.gridX} gridY={stageSprite.gridY} size={48} />
          </div>
          <div>
            <div className="plant-name">{strain.name}</div>
            <div className="plant-level">Level {plant.level}</div>
          </div>
        </div>
        <div className="plant-meta">
          <div className="plant-timer" title="Zeit bis Ernte">
            Timer <span>{formatTimer(timer)}</span>
          </div>
          <div className="plant-health">Vitalität {Math.round(plant.health)}%</div>
        </div>
        <div className="plant-prod" title="Ertrag je Ernte">
          {fmtNumber(yieldEstimate)} g
        </div>
      </div>
      <div className="plant-infobar">
        <span className="pill muted">{statuses[0]}</span>
        {plant.pest ? <span className="pill danger">Schädlinge</span> : <span className="pill">Stabil</span>}
        {ready && (
          <span className="pill ready" data-ready-flag="">
            Erntebereit
          </span>
        )}
      </div>
      <div className="plant-status">{statuses.slice(1).join(' · ') || 'Bereit'}</div>
      <div className="bar-row">
        <div className="bar-label">
          <i className="fi fi-sr-plant-alt"></i> Wachstum
        </div>
        <div className="progress" title="Wachstum">
          <div className="progress-bar" style={{ width: `${growPct}%` }} />
        </div>
        <div className="bar-value">{growPct}%</div>
      </div>
      <div className="bar-row">
        <div className="bar-label">
          <i className="fi fi-sr-raindrops"></i> Wasser
        </div>
        <div className="water" title="Wasserstand">
          <div className="water-bar" style={{ width: `${waterPct}%` }} />
        </div>
        <div className="bar-value">{waterPct}%</div>
      </div>
      <div className="bar-row">
        <div className="bar-label">
          <i className="fi fi-sr-flask"></i> Nährstoffe
        </div>
        <div className="nutrients" title="Nährstofflevel">
          <div className="nutrient-bar" style={{ width: `${nutrientPct}%` }} />
        </div>
        <div className="bar-value">{nutrientPct}%</div>
      </div>
      <div className="plant-hud">
        <div className="hud-actions">
          <div className="hud-left">
            <button className="icon-btn" aria-label="Ernten" title="Ernten" onClick={() => actions.harvestPlant(plant.slot)} disabled={!ready}>
              <i className="fi fi-sr-scissors"></i>
            </button>
            <button className="icon-btn" aria-label="Wässern" title="Wässern" onClick={() => actions.waterPlant(plant.slot)}>
              <i className="fi fi-sr-raindrops"></i>
            </button>
            <button className="icon-btn" aria-label="Düngen" title="Düngen" onClick={() => actions.feedPlant(plant.slot)}>
              <i className="fi fi-sr-flask"></i>
            </button>
            <button className="icon-btn" aria-label="Abwehr" title="Abwehr" onClick={() => actions.treatPlant(plant.slot)}>
              <i className="fi fi-sr-bug"></i>
            </button>
            <button className="icon-btn" aria-label="Upgrade" title="Upgrade" onClick={() => actions.upgradePlant(plant.slot)}>
              <i className="fi fi-sr-level-up-alt"></i>
            </button>
          </div>
          <div className="hud-right">
            <button className="icon-btn danger" aria-label="Entfernen" title="Entfernen" onClick={() => actions.removePlant(plant.slot)}>
              <i className="fi fi-sr-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
