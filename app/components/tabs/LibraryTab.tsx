'use client';

import React, { useState } from 'react';
import { GameState, Strain } from '@/lib/game/types';
import { fmtNumber } from '@/lib/game/utils';

type Props = { state: GameState };

const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

export function LibraryTab({ state }: Props) {
  const strains: Strain[] = [...(state.customStrains || []), ...(state.customStrains?.length ? [] : [])];
  const base = state.customStrains?.length ? state.customStrains : [];
  const discoveredBase = (state.discoveredStrains || Object.keys(state.seeds || {})).map((id) =>
    (state.customStrains || []).find((s) => s.id === id) || (state as any).strains?.find((s: Strain) => s.id === id)
  );
  const all = [
    ...(state.customStrains || []),
    ...(state.discoveredStrains ? discoveredBase.filter(Boolean) : [])
  ].filter(Boolean) as Strain[];

  const [sort, setSort] = useState<'generation' | 'yield' | 'name'>('generation');
  const sorted = [...all].sort((a, b) => {
    if (sort === 'generation') return (b.generation || 0) - (a.generation || 0);
    if (sort === 'yield') return (b.yield || 0) - (a.yield || 0);
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <section id="tab-library" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Genetik-Bibliothek</h2>
          <span className="hint">Eigene Hybride und entdeckte Sorten</span>
        </div>
        <div className="library-toolbar">
          <label>
            Sortieren nach:{' '}
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="generation">Generation</option>
              <option value="yield">Ertrag</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div className="library-grid">
          {sorted.length === 0 && <div className="placeholder">Noch keine Züchtungen.</div>}
          {sorted.map((s) => (
            <div key={s.id} className="library-card">
              <div className="lib-head">
                <div>
                  <div className="lib-name">{s.name}</div>
                  <div className="lib-meta">
                    Gen {s.generation || 1} · {s.rarity || 'common'}
                  </div>
                </div>
                <div className="lib-yield">{fmtNumber(s.yield || 0)} g</div>
              </div>
              <div className="lib-body">
                <div>Wachstum: {fmtNumber(s.grow || 0)}s</div>
                <div>Qualität: {(s.quality || 1).toFixed(2)}</div>
              </div>
              <div className="lib-traits">
                {(s.traits || []).length === 0 && <span className="muted">Keine Traits</span>}
                {(s.traits || []).map((t) => (
                  <span key={t.id} className={`trait-badge ${t.isNegative ? 'negative' : ''}`} title={t.desc}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
