'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildCaseConfigs, CASE_RARITY_LABEL, STRAINS } from '@/lib/game/data';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { fmtNumber } from '@/lib/game/utils';
import { getAllStrains } from '@/lib/game/engine';
import { CaseReel } from '../cases/CaseReel';

type Props = { state: GameState; actions: GameActions };

export function CasesTab({ state, actions }: Props) {
  const configs = useMemo(() => buildCaseConfigs(getAllStrains(state)), [state.customStrains, state.caseInventory, state.caseStats, state.cash]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winStrainId, setWinStrainId] = useState<string | undefined>(undefined);
  const [winCaseName, setWinCaseName] = useState('');
  const [showDropModal, setShowDropModal] = useState(false);
  const [activeCase, setActiveCase] = useState<string>(() => configs[0]?.id || 'starter');
  const [spinKey, setSpinKey] = useState<number>(0);

  const lastDrop = useMemo(() => state.caseStats.lastDrop, [state.caseStats.lastDrop, state.caseStats.lastRarity]);
  const lastDropId = useMemo(() => {
    if (!state.caseStats.lastDrop) return undefined;
    const match = STRAINS.find((s) => s.name === state.caseStats.lastDrop);
    return match?.id;
  }, [state.caseStats.lastDrop]);

  const selectedCase = configs.find((c) => c.id === activeCase) || configs[0];

  const openCase = (cfgId: string, fast?: boolean) => {
    setActiveCase(cfgId);
    actions.openCase(cfgId, fast);
    setWinCaseName(configs.find((c) => c.id === cfgId)?.name || '');
    if (fast) {
      setIsSpinning(false);
      setWinStrainId(undefined);
      setShowDropModal(true);
      return;
    }
    setIsSpinning(true);
  };

  useEffect(() => {
    if (!isSpinning) return;
    if (!lastDrop) return;
    setWinStrainId(lastDropId);
    setSpinKey(Date.now());
    const t = setTimeout(() => {
      setIsSpinning(false);
      setShowDropModal(true);
    }, 4500);
    return () => clearTimeout(t);
  }, [isSpinning, lastDrop, lastDropId]);

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
            {configs.map((cfg) => {
              const selected = cfg.id === activeCase;
              return (
                <div key={cfg.id} className={`shop-item ${selected ? 'shop-item-active' : ''}`}>
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
                      <button className="ghost" onClick={() => setActiveCase(cfg.id)} disabled={isSpinning}>
                        Auswählen
                      </button>
                      <button className="secondary" onClick={() => openCase(cfg.id, true)} disabled={state.cash < cfg.price || isSpinning}>
                        Schnell
                      </button>
                      <button className="accent" onClick={() => openCase(cfg.id)} disabled={state.cash < cfg.price || isSpinning}>
                        Öffnen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel cases-reel-wrapper" style={{ gridColumn: '2 / 3' }}>
          <div className="panel-header">
            <h3>Case Opener</h3>
            <span className="hint">{selectedCase?.name || 'Bereit'}</span>
          </div>
          <CaseReel caseId={selectedCase?.id || 'starter'} winningStrainId={winStrainId} spinTrigger={spinKey} />
          <div className="muted">{isSpinning ? 'Spinning...' : 'Bereit zum Öffnen'}</div>
        </div>

        <div className="panel cases-stats" style={{ gridColumn: '2 / 3' }}>
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
        <div className="panel cases-inventory" style={{ gridColumn: '2 / 3' }}>
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

      {showDropModal && (
        <div className="modal show cases-modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Drop erhalten</h3>
            <div className="cases-drop-card">
              <h4>{state.caseStats.lastDrop || 'Unbekannt'}</h4>
              <p>Seltenheit: {CASE_RARITY_LABEL[state.caseStats.lastRarity as keyof typeof CASE_RARITY_LABEL] || state.caseStats.lastRarity || '-'}</p>
            </div>
            <div className="modal-actions">
              <button className="accent" onClick={() => setShowDropModal(false)}>
                Weiter
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
