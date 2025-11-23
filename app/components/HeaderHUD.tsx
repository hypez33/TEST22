'use client';

import { fmtNumber } from '@/lib/game/utils';
import { GameState } from '@/lib/game/types';
import { xpForNext } from '@/lib/game/engine';

type Props = {
  state: GameState;
  perSec: number;
  onSpeedChange: (speed: number) => void;
  gameClock: string;
};

const SPEED_OPTIONS = [
  { label: 'Pause', value: 0 },
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '7x (Premium)', value: 7 }
];

export function HeaderHUD({ state, perSec, onSpeedChange, gameClock }: Props) {
  const xpNeed = xpForNext(state.level || 1);
  const xpPct = Math.min(100, Math.max(0, ((state.xp || 0) / xpNeed) * 100));

  const issues: string[] = [];
  if ((state.itemsOwned['shears'] || 0) <= 0) issues.push('Werkzeug fehlt: Schere');
  if (state?.maintenance?.filterPenaltyActive) issues.push('Filter ersetzen');
  if ((state.marketTimer || 0) > 0 && (state.marketMult || 1) !== 1) {
    issues.push(`Event: ${state.marketEventName || 'Markt'} x${(state.marketMult || 1).toFixed(2)}`);
  }
  if ((state.cash || 0) < 0) issues.push('Konto im Minus');

  return (
    <header className="app-header">
      <div className="title-wrap">
        <img src="/assets/logo.png" alt="BudLife Logo" className="logo-img" />
        <h1>BudLife</h1>
      </div>
      <div className="header-right">
        <div className="hud-grid">
          <div className="stat-pill" title="Aktueller Kontostand">
            <span id="grams">
              <span className="gram-value">{fmtNumber(state.grams)}</span> g
            </span>
          </div>
          <div className="stat-pill" title="Bargeld">
            <span className="coin-text">
              <img src="/assets/coin.png" alt="" className="coin-icon" /> {fmtNumber(state.cash)}
            </span>
          </div>
          <div className="stat-pill" title="Level / Erfahrung">
            <div className="level-wrap">
              <span id="level">Lvl {state.level || 1}</span>
              <div className="xp-bar">
                <div id="xpFill" style={{ width: xpPct.toFixed(1) + '%' }} />
              </div>
            </div>
          </div>
          <div className="stat-pill" title="Spielzeit">
            <span id="gameClock">{gameClock}</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="speed-controls" title="Zeittempo">
            <label htmlFor="speedSelect" className="muted-label">
              Tempo
            </label>
            <select id="speedSelect" value={state.timeSpeed} onChange={(e) => onSpeedChange(parseFloat(e.target.value))}>
              {SPEED_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {issues.length > 0 ? (
            <div className="stat-pill warn">{issues.join(' • ')}</div>
          ) : (
            <div className="stat-pill" aria-hidden="true">
              {fmtNumber(perSec)} g/s
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
