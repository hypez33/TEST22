'use client';

import { buildCaseConfigs, CASE_RARITY_LABEL } from '@/lib/game/data';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { fmtNumber } from '@/lib/game/utils';
import { getAllStrains } from '@/lib/game/engine';

type Props = { state: GameState; actions: GameActions };

export function CasesTab({ state, actions }: Props) {
  const configs = buildCaseConfigs(getAllStrains(state));

  return (
    <section id="tab-cases" className="tab">
      <div className="cases-intro panel">
        <div className="cases-intro-copy">
          <h2>Case Opening</h2>
          <p>Ziehe seltene Samen im CS:GO Style.</p>
        </div>
        <div className="cases-intro-meta">
          <div className="cases-meta-block">
            <span className="cases-meta-label">Cash</span>
            <span className="cases-meta-value">
              <span className="coin-text">
                <img src="/assets/coin.png" alt="" className="coin-icon" /> {fmtNumber(state.cash)}
              </span>
            </span>
          </div>
          <div className="cases-meta-block">
            <span className="cases-meta-label">Geöffnete Cases</span>
            <span className="cases-meta-value">{state.caseStats.opened}</span>
          </div>
        </div>
      </div>
      <div className="cases-grid">
        <div className="panel cases-control">
          <div className="cases-list">
            {configs.map((cfg) => (
              <div key={cfg.id} className="shop-item">
                <div className="shop-item-left">
                  <div className="shop-item-name">{cfg.name}</div>
                  <div className="shop-item-desc">{cfg.description}</div>
                </div>
                <div className="shop-item-right">
                  <div className="shop-item-price">
                    <span className="coin-text">
                      <img src="/assets/coin.png" alt="" className="coin-icon" /> {fmtNumber(cfg.price)}
                    </span>
                  </div>
                  <div className="cases-buttons">
                    <button className="secondary" onClick={() => actions.openCase(cfg.id, true)} disabled={state.cash < cfg.price}>
                      Schnell
                    </button>
                    <button className="accent" onClick={() => actions.openCase(cfg.id)} disabled={state.cash < cfg.price}>
                      Öffnen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel cases-stats">
          <div className="case-stat">
            <span className="case-stat-label">Geöffnete Cases</span>
            <span className="case-stat-value">{state.caseStats.opened}</span>
          </div>
          <div className="case-stat">
            <span className="case-stat-label">Seltenste Belohnung</span>
            <span className="case-stat-value" data-rarity={state.caseStats.bestRarity}>
              {state.caseStats.bestDrop || '-'}
            </span>
          </div>
          <div className="case-stat">
            <span className="case-stat-label">Letzter Drop</span>
            <span className="case-stat-value" data-rarity={state.caseStats.lastRarity}>
              {state.caseStats.lastDrop || '-'}
            </span>
          </div>
          <div className="case-stat">
            <span className="case-stat-label">Fast Opens</span>
            <span className="case-stat-value">{state.caseStats.fastOpened}</span>
          </div>
        </div>
        <div className="panel cases-inventory">
          <div className="cases-inventory-head">
            <h3>Deine Drops</h3>
          </div>
          <div className="cases-inventory-grid">
            {Object.keys(state.caseInventory || {}).length === 0 && <div className="placeholder">Noch keine Drops.</div>}
            {Object.entries(state.caseInventory || {}).map(([id, qty]) => (
              <div key={id} className="cases-drop-card">
                <h4>{id}</h4>
                <p>Menge: {qty}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
