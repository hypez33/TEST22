'use client';

import { PlantCard } from '../PlantCard';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { currentMaxSlots, getAllStrains } from '@/lib/game/engine';
import { fmtNumber } from '@/lib/game/utils';

type Props = {
  state: GameState;
  perSec: number;
  actions: GameActions;
};

export function FarmTab({ state, perSec, actions }: Props) {
  const strains = getAllStrains(state);
  const slotMax = currentMaxSlots(state);
  const unlocked = Math.max(0, state.slotsUnlocked || 0);
  const slots = Array.from({ length: slotMax }, (_, i) => i);
  const seedsAvailable = Object.entries(state.seeds || {}).filter(([, count]) => count > 0);

  return (
    <section id="tab-farm" className="tab active">
      <div className="row summary">
        <div className="summary-item">
          <div className="label">Lager (trocken)</div>
          <div className="value">{fmtNumber(state.grams)} g</div>
        </div>
        <div className="summary-item">
          <div className="label">Produktion (trocken)</div>
          <div className="value">{fmtNumber(perSec)} g/s</div>
        </div>
        <div className="summary-item">
          <div className="label">Haze-Punkte</div>
          <div className="value">{state.hazePoints || 0}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>🌿 Grow Room</h2>
          <div className="grow-controls">
            <span className="hint">
              Plätze: <span>{unlocked}</span>/<span>{slotMax}</span> * Erweitere deinen Raum im Tab Immobilien
            </span>
            <div className="grow-actions">
              <button className="ghost" type="button" onClick={actions.bulkWater}>
                <i className="fi fi-sr-raindrops"></i> Durstige gießen
              </button>
              <button className="ghost" type="button" onClick={actions.bulkFeed}>
                <i className="fi fi-sr-flask"></i> Hungrige düngen
              </button>
              <button className="accent" type="button" onClick={actions.harvestAllReady}>
                <i className="fi fi-sr-scissors"></i> Alle reifen ernten
              </button>
            </div>
          </div>
        </div>
        <div className="slots">
          {slots.map((i) => {
            const plant = state.plants.find((p) => p.slot === i);
            if (plant) {
              const strain = strains.find((s) => s.id === plant.strainId) || strains[0];
              return (
                <div key={i} className="slot slot-has-plant" data-slot={i}>
                  <PlantCard plant={plant} strain={strain} state={state} actions={actions} />
                </div>
              );
            }
            const locked = i >= unlocked;
            if (locked) {
              return (
                <div key={i} className="slot slot-locked" data-slot={i}>
                  <div className="slot-empty-card locked-card">
                    <div className="slot-empty-content">
                      <div className="slot-empty-title">Slot gesperrt</div>
                      <p className="slot-empty-text">Erhöhe deine Slots oder erweitere den Raum.</p>
                      <div className="slot-empty-actions">
                        <button className="ghost" type="button" onClick={actions.unlockSlot}>
                          Freischalten
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="slot slot-empty" data-slot={i}>
                <div className="slot-empty-card">
                  <div className="slot-empty-icon">
                    <i className="fi fi-rr-seedling"></i>
                  </div>
                  <div className="slot-empty-content">
                    <div className="slot-empty-title">Slot {i + 1}</div>
                    <p className="slot-empty-text">Setze eine neue Sorte.</p>
                    <div className="slot-empty-actions">
                      {seedsAvailable.length === 0 ? (
                        <button className="ghost" type="button" onClick={() => actions.buySeed(strains[0].id)}>
                          Keine Samen • Shop öffnen
                        </button>
                      ) : (
                        <SeedSelect seedsAvailable={seedsAvailable} strains={strains} onPlant={(strainId) => actions.plantSeed(i, strainId)} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type SeedSelectProps = {
  seedsAvailable: [string, number][];
  strains: { id: string; name: string }[];
  onPlant: (id: string) => void;
};

function SeedSelect({ seedsAvailable, strains, onPlant }: SeedSelectProps) {
  const [firstId] = seedsAvailable[0];
  return (
    <div className="seed-select-inline">
      <select onChange={(e) => onPlant(e.target.value)} defaultValue="">
        <option value="" disabled>
          Samen wählen
        </option>
        {seedsAvailable.map(([id, count]) => {
          const strain = strains.find((s) => s.id === id);
          return (
            <option key={id} value={id}>
              {strain?.name || id} ({count})
            </option>
          );
        })}
      </select>
      <button className="accent" type="button" onClick={() => onPlant(firstId)}>
        Pflanzen
      </button>
    </div>
  );
}
