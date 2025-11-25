'use client';

import { JOBS } from '@/lib/game/data';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { fmtNumber } from '@/lib/game/utils';

type Props = { state: GameState; actions: GameActions };

export function JobsTab({ state, actions }: Props) {
  const current = JOBS.find((j) => j.id === state.jobId);

  return (
    <section id="tab-jobs" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Jobs</h2>
          <span className="hint">Bewirb dich und verdiene monatlich Geld</span>
        </div>
        <div className="responsive-grid jobs-grid">
          <div className="jobs-header">
            <h3>Aktueller Job: {current ? current.name : 'Keiner'}</h3>
            {current && (
              <button className="ghost" type="button" onClick={actions.fireJob}>
                Kündigen
              </button>
            )}
          </div>
          {JOBS.map((job) => {
            const eligible = (state.level || 1) >= job.reqLevel;
            const owned = state.jobId === job.id;
            const pendingApp = (state.applications || []).find((a) => a.jobId === job.id);
            const daysLeft = pendingApp ? Math.max(0, Math.ceil((pendingApp.decideAt || 0) - (state.gameDaysTotal || 0))) : 0;
            return (
              <div key={job.id} className={`job-card ${owned ? 'job-card-active' : ''} ${!eligible ? 'job-card-locked' : ''}`}>
                <div className="job-title">{job.name}</div>
                <div className="job-salary">
                  {fmtNumber(job.salary)} <span className="coin-text">/Monat</span>
                </div>
                <div className="job-tags">
                  <span>Level {job.reqLevel}+</span>
                  <span>Basis {Math.round(job.base * 100)}%</span>
                </div>
                <p className="job-desc">{job.desc}</p>
                <div className="jobs-card-actions">
                  {owned ? (
                    <button className="ghost" type="button" onClick={actions.fireJob}>
                      Kündigen
                    </button>
                  ) : pendingApp ? (
                    <button className="secondary" type="button" disabled>
                      Bewerbung läuft {daysLeft > 0 ? `(${daysLeft} Tage)` : ''}
                    </button>
                  ) : (
                    <button className="accent" type="button" onClick={() => actions.applyForJob(job.id)} disabled={!eligible}>
                      {eligible ? 'Bewerben' : `Gesperrt (Lvl ${job.reqLevel})`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
