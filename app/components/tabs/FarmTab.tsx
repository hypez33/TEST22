'use client';

import { useState } from 'react';
import { PlantCard } from '../PlantCard';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { currentMaxSlots, getAllStrains } from '@/lib/game/engine';
import { fmtNumber } from '@/lib/game/utils';
import { EMPLOYEES } from '@/lib/game/data';

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
  const [seedSort, setSeedSort] = useState<'rarity' | 'qty' | 'name'>('rarity');

  return (
    <section id="tab-farm" className="tab active">
      <div className="row summary wide">
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
              <label className="chip small">
                <input
                  type="checkbox"
                  checked={!!state.bulkConserve}
                  onChange={(e) => actions.toggleBulkConserve?.(e.target.checked)}
                />{' '}
                Nur unter 50% versorgen
              </label>
            </div>
          </div>
        </div>
        <div className="farm-grid">
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
                          <SeedSelect
                            seedsAvailable={seedsAvailable}
                            strains={strains}
                            onPlant={(strainId) => actions.plantSeed(i, strainId)}
                            favorites={state.favorites || []}
                            onToggleFavorite={(id) => actions.toggleFavorite?.(id)}
                            sort={seedSort}
                            onSortChange={setSeedSort}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="farm-staff">
            <div className="panel mini-panel">
              <div className="panel-header">
                <h4><i className="fi fi-sr-users" aria-hidden="true"></i> Mitarbeiter-Status</h4>
              </div>
              <div className="employee-mini-list">
                {EMPLOYEES.filter((e) => state.employees?.[e.id]?.hired).length === 0 && (
                  <div className="placeholder small">Kein Mitarbeiter aktiv.</div>
                )}
                {EMPLOYEES.filter((e) => state.employees?.[e.id]?.hired).map((emp) => {
                  const data = state.employees[emp.id] || {};
                  const energy = Math.round(data.energy || 0);
                  const resting = !!data.resting;
                  const icon = energy > 66 ? '🔋' : energy > 33 ? '🔋' : '🪫';
                  return (
                    <div key={emp.id} className="employee-mini-card">
                      <div className="mini-head">
                        <div className="mini-name">{emp.name} <span className="mini-level">Lv.{data.level || 1}</span></div>
                        <div className={`mini-state ${resting ? 'resting' : 'active'}`}>{resting ? 'Pause' : 'Aktiv'}</div>
                      </div>
                      <div className="mini-tasks">{emp.tasks.join(', ')}</div>
                      <div className="mini-energy">
                        <span className="mini-icon">{icon}</span>
                        <div className="progress">
                          <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, energy))}%` }} />
                        </div>
                        <span className="mini-energy-text">{energy}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

type SeedSelectProps = {
  seedsAvailable: [string, number][];
  strains: { id: string; name: string; rarity?: string }[];
  favorites: string[];
  sort: 'rarity' | 'qty' | 'name';
  onSortChange: (s: 'rarity' | 'qty' | 'name') => void;
  onPlant: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
};

function SeedSelect({ seedsAvailable, strains, favorites, sort, onSortChange, onPlant, onToggleFavorite }: SeedSelectProps) {
  if (seedsAvailable.length === 0) return null;
  const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  const sorted = [...seedsAvailable].sort(([idA, qtyA], [idB, qtyB]) => {
    const favA = favorites.includes(idA) ? 1 : 0;
    const favB = favorites.includes(idB) ? 1 : 0;
    if (favA !== favB) return favB - favA; // favorites first
    if (sort === 'qty') return qtyB - qtyA;
    if (sort === 'rarity') {
      const ra = rarityOrder.indexOf((strains.find((s) => s.id === idA)?.rarity as string) || '');
      const rb = rarityOrder.indexOf((strains.find((s) => s.id === idB)?.rarity as string) || '');
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    }
    const nameA = strains.find((s) => s.id === idA)?.name || idA;
    const nameB = strains.find((s) => s.id === idB)?.name || idB;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="seed-select-inline">
      <div className="seed-sorter">
        <label>
          Sortieren nach:{' '}
          <select value={sort} onChange={(e) => onSortChange(e.target.value as SeedSelectProps['sort'])}>
            <option value="rarity">Rarität</option>
            <option value="qty">Menge</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <div className="seed-list">
        {sorted.map(([id, qty]) => {
          const strain = strains.find((s) => s.id === id);
          const fav = favorites.includes(id);
          return (
            <div key={id} className="seed-row">
              <button className={`fav-btn ${fav ? 'active' : ''}`} type="button" onClick={() => onToggleFavorite?.(id)} aria-label="Favorisieren">
                {fav ? '★' : '☆'}
              </button>
              <div className="seed-info">
                <div className="seed-name">
                  {strain?.name || id} <span className="pill muted">{strain?.rarity || '—'}</span>
                </div>
                <div className="seed-meta">Menge: {qty}</div>
              </div>
              <button className="accent" type="button" onClick={() => onPlant(id)}>
                Pflanzen
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
