'use client';

import Image from 'next/image';
import { harvestYieldFor, qualityMultiplier, statusForPlant, timerForPlant, DRY_WEIGHT_MULTIPLIER, WATER_COST_PER_USE } from '@/lib/game/engine';
import { NUTRIENT_MAX, WATER_MAX } from '@/lib/game/data';
import { fmtNumber, formatTimer } from '@/lib/game/utils';
import { GameState, Plant, Strain } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { emitFloatingText } from './ui/FloatingTextLayer';
import React from 'react';
import { useSound } from '../hooks/useSound';

type Props = {
  plant: Plant;
  strain: Strain;
  state: GameState;
  actions: GameActions;
};

export function PlantCard({ plant, strain, state, actions }: Props) {
  const harvestSound = useSound('/assets/audio/harvest.mp3', state.soundFx !== false);
  const growPct = Math.round((plant.growProg || 0) * 100);
  const waterPct = Math.round(((plant.water || 0) / WATER_MAX) * 100);
  const nutrientPct = Math.round(((plant.nutrients || 0) / NUTRIENT_MAX) * 100);
  const timer = timerForPlant(state, plant);
  const statuses = statusForPlant(state, plant);
  const wetYield = harvestYieldFor(state, plant) * qualityMultiplier(state, plant);
  const dryYield = wetYield * DRY_WEIGHT_MULTIPLIER;
  const ready = plant.growProg >= 1;
  const isWilted = (plant.health || 0) <= 0;
  const hasPest = !!plant.pest;

  const phase = (() => {
    const gp = Math.max(0, Math.min(1, plant.growProg || 0));
    const thresholds = [0.12, 0.25, 0.37, 0.5, 0.62, 0.75, 0.87, 1];
    const idx = thresholds.findIndex((t) => gp <= t);
    return idx === -1 ? 8 : idx + 1;
  })();

  const phaseImage = `/assets/phase${phase}.png`;

  const showFloat = (text: string, e: React.MouseEvent, tone: 'gain' | 'loss' | 'info' = 'gain') => {
    emitFloatingText(text, e.clientX, e.clientY, tone);
  };

  const handleHarvest = (e: React.MouseEvent) => {
    if (!ready) return;
    actions.harvestPlant(plant.slot);
    showFloat(`+${fmtNumber(wetYield)}g Nass`, e, 'gain');
    harvestSound.play();
  };

  const handleWater = (e: React.MouseEvent) => {
    if ((state.cash || 0) < WATER_COST_PER_USE) {
      showFloat('Zu wenig Cash', e, 'loss');
      return;
    }
    actions.waterPlant(plant.slot);
    showFloat(`-${WATER_COST_PER_USE.toFixed(2)} $`, e, 'info');
  };

  const handleFeed = (e: React.MouseEvent) => {
    if ((state.consumables.nutrient || 0) <= 0) {
      showFloat('Kein Dünger!', e, 'loss');
      return;
    }
    actions.feedPlant(plant.slot);
    showFloat('-1 Dünger', e, 'info');
  };

  const handleTreat = (e: React.MouseEvent) => {
    actions.treatPlant(plant.slot);
    showFloat('Abwehr', e, 'info');
  };

  return (
    <div className={`plant-card ${ready ? 'plant-card-ready' : ''}`} data-slot={plant.slot}>
      <div className="plant-header">
        <div className="plant-left">
          <div className="plant-name">{strain.name}</div>
          <div className="plant-level">Level {plant.level}</div>
        </div>
        <div className="plant-meta">
          <div className="plant-timer" title="Zeit bis Ernte">
            Timer <span>{formatTimer(timer)}</span>
          </div>
          <div className="plant-health">Vitalität {Math.round(plant.health)}%</div>
        </div>
        <div className="plant-prod" title="Ertrag je Ernte (trocken)">
          {fmtNumber(dryYield)} g
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
      <div className="plant-visual">
        <div className={`plant-media ${isWilted ? 'wilted' : ''} ${hasPest ? 'pested' : ''}`}>
          <Image src={phaseImage} alt={`Wachstumsphase ${phase}`} width={220} height={180} className="plant-phase-img" />
          {hasPest && (
            <div className="plant-overlay pest">
              <i className="fi fi-sr-bug" aria-hidden="true" /> Befall
            </div>
          )}
          {isWilted && <div className="plant-overlay wilt">Verwelkt</div>}
          {ready && <div className="plant-overlay ready">Ernte!</div>}
        </div>
        <div className="phase-indicator">
          Phase {phase}/8 · {growPct}%
        </div>
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
            <button className="icon-btn" aria-label="Ernten" title="Ernten" onClick={handleHarvest} disabled={!ready}>
              <i className="fi fi-sr-scissors"></i>
            </button>
            <button className="icon-btn" aria-label="Wässern" title={`Kosten: ${WATER_COST_PER_USE.toFixed(2)} $`} onClick={handleWater}>
              <i className="fi fi-sr-raindrops"></i>
            </button>
            <button className="icon-btn" aria-label="Düngen" title="Düngen" onClick={handleFeed}>
              <i className="fi fi-sr-flask"></i>
            </button>
            <button className="icon-btn" aria-label="Abwehr" title="Abwehr" onClick={handleTreat}>
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
