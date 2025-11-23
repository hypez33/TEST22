'use client';

import { RESEARCH_TREE } from '@/lib/game/data';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { researchAvailable, researchEffects } from '@/lib/game/engine';

type Props = { state: GameState; actions: GameActions };

export function ResearchTab({ state, actions }: Props) {
  const avail = researchAvailable(state);
  const eff = researchEffects(state);
  return (
    <section id="tab-research" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Forschung</h2>
          <span className="hint">Baue deine Infrastruktur aus</span>
        </div>
        <div className="settings-row">
          <div>Verfügbare Punkte: <strong>{avail}</strong></div>
          <div className="hint">
            Aktive Boni – Ertrag +{Math.round(eff.yield * 100)}%, Wachstum +{Math.round(eff.growth * 100)}%, Qualität +{Math.round(eff.quality * 100)}%, Risiko -{Math.round(eff.pest * 100)}%
          </div>
        </div>
        <div className="research-list">
          {Object.entries(RESEARCH_TREE).map(([branchKey, branch]) => (
            <div key={branchKey} className="research-branch">
              <div className="branch-head">
                <span className="branch-icon">{branch.icon}</span>
                <span className="branch-name">{branch.name}</span>
              </div>
              <div className="node-grid">
                {Object.entries(branch.nodes).map(([nodeId, node]) => {
                  const owned = !!state.research[nodeId];
                  const canBuy = !owned && avail >= node.cost && node.requires.every((req) => state.research[req]);
                  return (
                    <div key={nodeId} className={`node-card ${owned ? 'owned' : ''}`}>
                      <div className="node-name">{node.name}</div>
                      <div className="node-desc">{node.desc}</div>
                      <div className="node-meta">Kosten: {node.cost}</div>
                      <button className="secondary" disabled={!canBuy} onClick={() => actions.buyResearch(nodeId)}>
                        {owned ? 'Gekauft' : 'Kaufen'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
