'use client';

import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { useMemo, useState } from 'react';
import { QUESTS } from '@/lib/game/quests';
import { fmtNumber } from '@/lib/game/utils';

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
              <QuestPanel state={state} actions={actions} />
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

function QuestPanel({ state, actions }: { state: GameState; actions: GameActions }) {
  const progress = state.quests || [];
  const completed = new Set(state.completedQuests || []);
  const active = progress.filter((q) => q.status !== 'claimed');
  const upcoming = QUESTS.filter((q) => !progress.some((p) => p.id === q.id) && !completed.has(q.id));

  if (active.length === 0 && upcoming.length === 0) {
    return <div className="placeholder">Keine aktiven Quests. Spiele weiter, um neue Quests zu erhalten.</div>;
  }

  return (
    <div className="quest-list">
      {active.map((qp) => {
        const def = QUESTS.find((q) => q.id === qp.id);
        if (!def) return null;
        const ready = qp.status === 'ready';
        return (
          <div key={qp.id} className={`quest-step ${ready ? 'ready' : ''}`}>
            <div className="label">
              <div>
                <div>
                  <strong>{def.icon ? `${def.icon} ` : ''}{def.title}</strong>
                </div>
                <div className="quest-muted">{def.description}</div>
                <div className="quest-tasks">
                  {qp.tasks.map((t, idx) => {
                    const pct = Math.min(100, Math.round(((t.current || 0) / (t.amount || 1)) * 100));
                    return (
                      <div key={idx} className="quest-task">
                        <div className="quest-task-head">
                          <span>{renderTaskLabel(t)}</span>
                          <span className="quest-muted">{t.current || 0}/{t.amount}</span>
                        </div>
                        <div className="progress">
                          <div className="progress-bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="quest-rewards">
                  {def.rewards.map((r, i) => (
                    <span key={i} className="pill">
                      {renderReward(r)}
                    </span>
                  ))}
                </div>
              </div>
              {ready && (
                <button className="accent" onClick={() => actions.claimQuest(qp.id)}>
                  Belohnung abholen
                </button>
              )}
            </div>
          </div>
        );
      })}
      {upcoming.length > 0 && (
        <div className="quest-upcoming">
          <div className="quest-muted">Demnächst</div>
          {upcoming.map((q) => (
            <div key={q.id} className="quest-step small">
              <div className="label">
                <div>
                  <strong>{q.title}</strong>
                  <div className="quest-muted">Freischaltung: Lvl {q.requirements?.minLevel || 1}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderTaskLabel(t: any) {
  if (t.type === 'harvest') return t.target ? `Ernte ${t.amount}x ${t.target}` : `Ernte ${t.amount}x`;
  if (t.type === 'sell') return `Verkaufe ${fmtNumber(t.amount)} g`;
  if (t.type === 'cash') return `Verdiene ${fmtNumber(t.amount)} $`;
  if (t.type === 'level') return `Erreiche Level ${t.amount}`;
  return 'Aufgabe';
}

function renderReward(r: any) {
  if (r.cash) return `${fmtNumber(r.cash)} $`;
  if (r.xp) return `${fmtNumber(r.xp)} XP`;
  if (r.seed) return `${r.count || 1}x Samen ${r.seed}`;
  if (r.item) return `${r.count || 1}x Item ${r.item}`;
  if (r.consumable) return `${r.count || 1}x ${r.consumable}`;
  if (r.message) return String(r.message);
  return 'Belohnung';
}
