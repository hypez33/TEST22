'use client';

import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { getAllStrains } from '@/lib/game/engine';
import { fmtNumber } from '@/lib/game/utils';

interface Props {
  state: GameState;
  actions: GameActions;
}

export function BreedingTab({ state, actions }: Props) {
  const strains = getAllStrains(state);
  const seeds = Object.entries(state.seeds || {}).filter(([, qty]) => qty > 0);
  const slots = state.breedingSlots || { parent1: null, parent2: null };
  const strainA = slots.parent1 ? strains.find((s) => s.id === slots.parent1) : null;
  const strainB = slots.parent2 ? strains.find((s) => s.id === slots.parent2) : null;
  const avgStats =
    strainA && strainB
      ? {
          yield: (strainA.yield + strainB.yield) / 2,
          grow: (strainA.grow + strainB.grow) / 2,
          quality: (strainA.quality + strainB.quality) / 2
        }
      : null;

  const renderSlot = (parent: 1 | 2) => {
    const selected = slots[parent === 1 ? 'parent1' : 'parent2'];
    const strain = selected ? strains.find((s) => s.id === selected) : null;
    return (
      <div className="breeding-slot" data-parent={parent}>
        {strain ? (
          <div className="strain-info">
            {strain.name}
            <button className="remove-seed" onClick={() => actions.setBreedingParent(parent, null)}>
              X
            </button>
          </div>
        ) : (
          <select value={selected || ''} onChange={(e) => actions.setBreedingParent(parent, e.target.value || null)}>
            <option value="">Samen setzen</option>
            {seeds.map(([id, qty]) => {
              const s = strains.find((st) => st.id === id);
              return (
                <option key={id} value={id}>
                  {s?.name || id} ({qty})
                </option>
              );
            })}
          </select>
        )}
      </div>
    );
  };

  const ready = slots.parent1 && slots.parent2 && slots.parent1 !== slots.parent2;

  return (
    <section id="tab-breeding" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Kreuzungslabor</h2>
          <span className="hint">Setze Samen in Slots und kreuze sie</span>
        </div>
        <div className="breeding-interface">
          <div className="breeding-selection">
            <div className="breeding-parent">
              <h3>Elternteil 1</h3>
              {renderSlot(1)}
            </div>
            <div className="breeding-cross">+</div>
            <div className="breeding-parent">
              <h3>Elternteil 2</h3>
              {renderSlot(2)}
            </div>
            <div className="breeding-arrow">→</div>
            <div className="breeding-result">
              <h3>Neue Sorte</h3>
              <div id="resultPreview">
                {ready && strainA && strainB ? (
                  <div className="hybrid-preview">
                    <div className="hybrid-preview-name">{`${strainA.name} x ${strainB.name}`}</div>
                    <div className="hybrid-preview-meta">
                      {strainA.rarity} / {strainB.rarity} · Chance auf höhere Seltenheit
                    </div>
                    {avgStats && (
                      <div className="hybrid-preview-stats">
                        <span>Ø Ertrag: {fmtNumber(avgStats.yield)} g</span>
                        <span>Ø Wachstum: {fmtNumber(avgStats.grow)}s</span>
                        <span>Ø Qualität: {avgStats.quality.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  'Kreuze zwei Sorten'
                )}
              </div>
            </div>
          </div>
          <button className="accent" disabled={!ready} onClick={actions.performBreeding}>
            Kreuzen (kostenlos)
          </button>
        </div>
      </div>
    </section>
  );
}
