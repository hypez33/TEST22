'use client';

import { GameState } from '@/lib/game/types';
import { fmtNumber } from '@/lib/game/utils';
import { researchAvailable } from '@/lib/game/engine';

type Props = { state: GameState };

export function StatsTab({ state }: Props) {
  const sec = Math.floor(state.playtimeSec || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const activeEvents = state.activeEvents || [];
  const researchPoints = researchAvailable(state);
  return (
    <section id="tab-stats" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>📊 dY's Statistiken</h2>
        </div>
        <div className="stats-grid">
          <div className="stat">
            <div className="label">Lebenszeit-Ertrag</div>
            <div className="value">{fmtNumber(state.totalEarned)} g</div>
          </div>
          <div className="stat">
            <div className="label">Beste Produktion</div>
            <div className="value">{fmtNumber(state.bestPerSec)} g/s</div>
          </div>
          <div className="stat">
            <div className="label">Pflanzen gesamt</div>
            <div className="value">{state.plants.length}</div>
          </div>
          <div className="stat">
            <div className="label">Spielzeit</div>
            <div className="value">{`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}</div>
          </div>
          <div className="stat">
            <div className="label">Resets</div>
            <div className="value">{state.resets || 0}</div>
          </div>
          <div className="stat">
            <div className="label">Reputation</div>
            <div className="value">{fmtNumber(state.reputation || 0)}</div>
          </div>
          <div className="stat">
            <div className="label">Trades erledigt</div>
            <div className="value">{fmtNumber(state.tradesDone || 0)}</div>
          </div>
          <div className="stat">
            <div className="label">Prestige-Bonus</div>
            <div className="value">x{(1 + 0.05 * Math.sqrt(state.hazePoints || 0)).toFixed(2)}</div>
          </div>
          <div className="stat">
            <div className="label">Forschungs-Punkte</div>
            <div className="value">{researchPoints}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Deine Meisterschaften</h3>
          <span className="hint">XP & Level pro Sorte</span>
        </div>
        <div className="offer-list">
          {Object.entries(state.strainMastery || {}).length === 0 && <div className="placeholder">Noch keine Meisterschaften gesammelt.</div>}
          {Object.entries(state.strainMastery || {}).map(([id, xp]) => {
            const lvl = xp >= 1000 ? 10 : xp >= 600 ? 7 : xp >= 300 ? 5 : xp >= 120 ? 3 : xp >= 60 ? 2 : xp >= 30 ? 1 : 0;
            return (
              <div key={id} className="offer-card">
                <div className="offer-meta">{id}</div>
                <div className="offer-desc">Level {lvl} · XP {fmtNumber(xp)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Aktive Events</h3>
          <span className="hint">Globale Spielereignisse</span>
        </div>
        {activeEvents.length === 0 && <div className="placeholder">Keine Events aktiv.</div>}
        <div className="offer-list">
          {activeEvents.map((ev: any) => (
            <div key={ev.type} className="offer-card">
              <div className="offer-meta">{ev.name}</div>
              <div className="offer-desc">{ev.desc}</div>
              <div className="offer-expire">Endet in: {Math.max(0, Math.round(ev.duration || 0))}s</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
