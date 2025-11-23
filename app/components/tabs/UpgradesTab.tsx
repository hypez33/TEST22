'use client';

import { GLOBAL_UPGRADES } from '@/lib/game/data';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { fmtNumber } from '@/lib/game/utils';
import { upgradeCost } from '@/lib/game/engine';

type Props = { state: GameState; actions: GameActions };

export function UpgradesTab({ state, actions }: Props) {
  return (
    <section id="tab-upgrades" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>🚀 Globale Upgrades</h2>
          <span className="hint">Verbessert alle Pflanzen</span>
        </div>
        <div className="upgrade-list">
          {GLOBAL_UPGRADES.map((up) => {
            const lvl = state.upgrades[up.id] || 0;
            const cost = upgradeCost(state, up.id);
            const canPay = state.cash >= cost || state.grams >= cost;
            const bonusPct = up.inc * 100;
            const bonusText = bonusPct >= 10 ? bonusPct.toFixed(0) : bonusPct.toFixed(1);
            return (
              <div key={up.id} className="upgrade">
                <div className="upgrade-body">
                  <div className="upgrade-title">{up.name}</div>
                  <div className="upgrade-meta">Stufe {lvl} · Bonus +{bonusText}%</div>
                  <div className="upgrade-desc">{up.desc}</div>
                  <div className="upgrade-status">Kosten: {fmtNumber(cost)} (Cash oder Gramm)</div>
                  <button className="upgrade-btn buy" onClick={() => actions.buyUpgrade(up.id)} disabled={!canPay}>
                    Kaufen
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
