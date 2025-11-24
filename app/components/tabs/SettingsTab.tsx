'use client';

import { useMemo, useState } from 'react';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { gameStateSchema } from '@/lib/game/saveSchema';

type Props = { state: GameState; actions: GameActions };

const encodeSave = (data: any) => {
  const json = JSON.stringify(data);
  return typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(json))) : json;
};

const decodeSave = (raw: string) => {
  try {
    const asJson = JSON.parse(raw);
    return asJson;
  } catch {
    try {
      const decoded = typeof atob !== 'undefined' ? atob(raw) : raw;
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
};

export function SettingsTab({ state, actions }: Props) {
  const [importText, setImportText] = useState('');
  const [confirmReset, setConfirmReset] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const exportString = useMemo(() => encodeSave(state), [state]);

  const handleImport = () => {
    const parsed = decodeSave(importText.trim());
    if (!parsed) {
      setStatus('Import fehlgeschlagen: ungültiges Format.');
      return;
    }
    try {
      const validated = gameStateSchema.parse(parsed);
      actions.importSave(validated as GameState);
      setStatus('Import erfolgreich!');
    } catch (err: any) {
      setStatus('Import fehlgeschlagen: ' + (err?.message || 'Validierung'));
    }
  };

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
            <div className="label">Sound FX</div>
            <label className="toggle">
              <input id="soundToggle" type="checkbox" checked={state.soundFx !== false} onChange={(e) => actions.setSoundFx?.(e.target.checked)} />
              <span className="slider" title="Soundeffekte umschalten"></span>
            </label>
            <span className="hint">Schaltet Soundeffekte ein/aus</span>
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
            <div className="label">Spielstand exportieren</div>
            <textarea readOnly value={exportString} rows={3}></textarea>
            <span className="hint">Base64 kopieren oder per Download speichern.</span>
          </div>
          <div className="settings-row">
            <div className="label">Spielstand importieren</div>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={3} placeholder="Base64 oder JSON einfügen"></textarea>
            <button className="accent" type="button" onClick={handleImport}>
              Importieren
            </button>
          </div>
          {status && <div className="hint">{status}</div>}
          <div className="settings-row">
            <div className="label">Hard Reset</div>
            <div className="hint">Tippe DELETE um zu bestätigen</div>
            <input value={confirmReset} onChange={(e) => setConfirmReset(e.target.value)} placeholder="DELETE" />
            <button className="ghost Duenger" onClick={() => confirmReset === 'DELETE' && actions.resetGame()} disabled={confirmReset !== 'DELETE'}>
              Hard Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
