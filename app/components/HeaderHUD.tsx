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
      <style jsx>{`
        .app-header {
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          min-height: 56px;
        }

        .title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: fit-content;
        }

        .logo-img {
          width: 40px;
          height: 40px;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
        }

        .title-wrap h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.5px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .hud-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(100px, 1fr));
          gap: 10px;
          flex: 1;
        }

        .stat-pill {
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          transition: all 0.3s ease;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 4px 12px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          white-space: nowrap;
        }

        .stat-pill::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .stat-pill:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .stat-pill:hover::before {
          left: 100%;
        }

        .stat-pill.warn {
          background: rgba(255, 107, 107, 0.12);
          border-color: rgba(255, 107, 107, 0.3);
          color: #ff9999;
        }

        .stat-pill.warn:hover {
          background: rgba(255, 107, 107, 0.18);
          border-color: rgba(255, 107, 107, 0.4);
        }

        #grams {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .gram-value {
          font-weight: 700;
          font-size: 1rem;
          color: #4ade80;
        }

        .coin-text {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .coin-icon {
          width: 18px;
          height: 18px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
        }

        .level-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        #level {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .xp-bar {
          width: 100%;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .xp-bar > div {
          height: 100%;
          background: linear-gradient(90deg, #60a5fa, #3b82f6);
          border-radius: 2px;
          transition: width 0.4s ease;
          box-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: fit-content;
        }

        .speed-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .muted-label {
          font-size: 0.8rem;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        #speedSelect {
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          padding: 8px 10px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        #speedSelect:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        #speedSelect:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 215, 0, 0.5);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 12px rgba(255, 215, 0, 0.3);
        }

        #speedSelect option {
          background: #1a1a1a;
          color: #fff;
          padding: 8px;
        }

        @media (max-width: 768px) {
          .app-header {
            flex-direction: column;
            gap: 12px;
            padding: 10px 16px;
          }

          .header-right {
            flex-direction: column;
            width: 100%;
            gap: 12px;
          }

          .hud-grid {
            width: 100%;
            grid-template-columns: repeat(2, 1fr);
          }

          .header-actions {
            width: 100%;
            flex-direction: column;
          }

          .speed-controls {
            width: 100%;
            justify-content: space-between;
          }

          .stat-pill.warn {
            width: 100%;
          }
        }

        @supports not (backdrop-filter: blur(1px)) {
          .app-header {
            background: rgba(255, 255, 255, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .stat-pill {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          #speedSelect {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>

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