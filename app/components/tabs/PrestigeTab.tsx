'use client';

import { GameActions } from '@/lib/game/useGameState';
import { GameState } from '@/lib/game/types';
import { calcPrestigeGain } from '@/lib/game/engine';
import { fmtNumber } from '@/lib/game/utils';

type Props = { state: GameState; actions: GameActions };

export function PrestigeTab({ state, actions }: Props) {
  const gain = calcPrestigeGain(state.totalEarned);
  const bonus = (1 + 0.05 * Math.sqrt(state.hazePoints || 0)).toFixed(2);
  return (
    <section id="tab-prestige" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Prestige / Haze</h2>
          <span className="hint">Setzt deine Farm zurück und erhält Haze-Punkte</span>
        </div>
        <div className="stats-grid">
          <div className="stat">
            <div className="label">Aktuelle Haze-Punkte</div>
            <div className="value">{state.hazePoints}</div>
          </div>
          <div className="stat">
            <div className="label">Prestige-Gewinn</div>
            <div className="value">{gain}</div>
          </div>
          <div className="stat">
            <div className="label">Bonus</div>
            <div className="value">x{bonus}</div>
          </div>
          <div className="stat">
            <div className="label">Lebenszeit-Ertrag</div>
            <div className="value">{fmtNumber(state.totalEarned)} g</div>
          </div>
        </div>
        <div className="settings-row">
          <button className="Duenger" disabled={gain <= 0} onClick={actions.doPrestige}>
            Prestige ausführen
          </button>
        </div>
      </div>
    </section>
  );
}
