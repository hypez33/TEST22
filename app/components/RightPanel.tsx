'use client';

import { questConditions } from '@/lib/game/engine';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { useMemo, useState } from 'react';

type Props = { state: GameState; actions: GameActions };

export function RightPanel({ state, actions }: Props) {
  const [tab, setTab] = useState<'quests' | 'news'>('quests');
  const messages = useMemo(() => (state.messages || []).slice(-15).reverse(), [state.messages]);
  const activeEvents = state.activeEvents || [];

  return (
    <aside className="right-panel">
      <div className="right-panel-content">
        <div className="panel-tabs">
          <button className={`panel-tab ${tab === 'quests' ? 'active' : ''}`} onClick={() => setTab('quests')}>
            Quests
          </button>
          <button
            className={`panel-tab ${tab === 'news' ? 'active' : ''}`}
            onClick={() => {
              setTab('news');
              actions.markMessagesRead();
            }}
          >
            News {state.unreadMessages > 0 ? `(${state.unreadMessages})` : ''}
          </button>
        </div>
        <div className="panel-content">
          {tab === 'quests' && (
            <div className="panel-section active">
              <h3>Quests</h3>
              <QuestPanel state={state} />
            </div>
          )}
          {tab === 'news' && (
            <div className="panel-section active">
              <h3>📰 Neuigkeiten</h3>
              <div className="news-feed">
                {messages.length === 0 && <div className="news-item">Keine Nachrichten.</div>}
                {messages.map((m) => (
                  <div key={m.id} className={`news-item ${m.type || 'info'}`}>
                    <div className="news-text">{m.text}</div>
                    <div className="news-time">{new Date(m.createdAt || Date.now()).toLocaleTimeString()}</div>
                  </div>
                ))}
                {activeEvents.length > 0 && (
                  <div className="news-item event">
                    <div className="news-text">Aktive Events:</div>
                    <ul>
                      {activeEvents.map((ev: any) => (
                        <li key={ev.type}>
                          {ev.name} · endet in {Math.max(0, Math.round(ev.duration || 0))}s
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function QuestPanel({ state }: { state: GameState }) {
  const cond = questConditions(state);
  const step = state.questStep || 0;
  return (
    <div className="quest-list">
      {step <= 0 && (
        <div className="quest-step">
          <div className="label">
            <div>
              <div>
                <strong>Quest 1:</strong> Finde einen Job
              </div>
              <div className="quest-muted">Wechsle zum Tab Jobs und bewirb dich.</div>
            </div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="quest-step">
          <div className="label">
            <div>
              <div>
                <strong>Quest 2:</strong> Shop-Grundausstattung kaufen
              </div>
              <div className="quest-muted">Samen, Giesskanne, Schere, Dünger, Fungizid, Spray</div>
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="quest-step">
          <div className="label">
            <div>
              <div>
                <strong>Quest 3:</strong> Pflanze setzen & Zeit starten
              </div>
              <div className="quest-muted">Setze einen Samen auf der Farm und starte die Zeit.</div>
            </div>
          </div>
        </div>
      )}
      {step >= 3 && (
        <div className="quest-step">
          <div className="label">
            <div>
              <strong>Starter-Quests erledigt</strong>
            </div>
            <div className="quest-muted">Viel Erfolg mit deiner Farm!</div>
          </div>
        </div>
      )}
      <div className="quest-meta">Status: {JSON.stringify(cond)}</div>
    </div>
  );
}
