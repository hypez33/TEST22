'use client';

import { GROW_ROOMS } from '@/lib/game/data';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { fmtNumber } from '@/lib/game/utils';

type Props = { state: GameState; actions: GameActions };

export function RealEstateTab({ state, actions }: Props) {
  const curIdx = state.growTierIndex || 0;
  return (
    <section id="tab-estate" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Immobilienmakler</h2>
          <span className="hint">Upgrade deinen Grow-Raum</span>
        </div>
        <div className="estate-grid">
          {GROW_ROOMS.map((room, idx) => {
            const owned = idx <= curIdx;
            const canSell = owned && idx > 0;
            const disabled = !owned && state.cash < room.cost;
            return (
              <div key={room.id} className="estate-card">
                <div className="estate-body">
                  <div className="estate-title">{room.name}</div>
                  <div className="estate-meta">Kapazität: {room.slots} Slots {!room.exhaust ? ' · keine Abluft' : ''}</div>
                  <div className="estate-desc">{room.desc}</div>
                  <div className="estate-status">{owned ? 'Besitzt' : `Kosten: ${fmtNumber(room.cost)}`}</div>
                  <button
                    className={`estate-btn ${canSell ? 'sell' : owned ? 'active' : 'buy'}`}
                    disabled={owned && !canSell ? true : disabled}
                    onClick={() => (canSell ? actions.sellEstate(room.id) : owned ? undefined : actions.buyEstate(room.id))}
                  >
                    {canSell ? 'Verkaufen (60% zurück)' : owned ? 'Aktiv' : 'Kaufen'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
