'use client';

import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';

type Props = { state: GameState; actions: GameActions };

export function SettingsTab({ state, actions }: Props) {
  return (
    <section id="tab-settings" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>⚙️ Einstellungen</h2>
          <span className="hint">Passe Schwierigkeit und Balance an</span>
        </div>
        <div className="settings">
          <div className="settings-row">
            <div className="label">Theme</div>
            <label className="toggle">
              <input id="themeToggle" type="checkbox" checked={state.theme === 'light'} onChange={(e) => actions.setTheme(e.target.checked ? 'light' : 'dark')} />
              <span className="slider" title="Dark Mode umschalten"></span>
            </label>
          </div>
          <div className="settings-row">
            <div className="label">Kompaktmodus</div>
            <label className="toggle">
              <input id="compactToggle" type="checkbox" checked={state.compactMode} onChange={(e) => actions.setDisplayPrefs(e.target.checked, state.highContrast)} />
              <span className="slider" title="Kompaktere Karten"></span>
            </label>
            <span className="hint">Weniger Padding, mehr Sicht auf Karten</span>
          </div>
          <div className="settings-row">
            <div className="label">Hoher Kontrast</div>
            <label className="toggle">
              <input id="contrastToggle" type="checkbox" checked={state.highContrast} onChange={(e) => actions.setDisplayPrefs(state.compactMode, e.target.checked)} />
              <span className="slider" title="Kontrast erhöhen"></span>
            </label>
            <span className="hint">Kräftigere Konturen für Lesbarkeit</span>
          </div>
          <div className="settings-row">
            <div className="label">Schwierigkeitsgrad</div>
            <div className="chips">
              {(['easy', 'normal', 'hard'] as GameState['difficulty'][]).map((diff) => (
                <button key={diff} className={`chip ${state.difficulty === diff ? 'active' : ''}`} onClick={() => actions.setDifficulty(diff)}>
                  {diff}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <button className="ghost Duenger" onClick={actions.resetGame}>
              Hard Reset (alle Daten löschen)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
