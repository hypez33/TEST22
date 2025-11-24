'use client';

import { APOTHEKEN_VERTRAEGE, EMPLOYEES } from '@/lib/game/data';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { fmtNumber } from '@/lib/game/utils';

type Props = { state: GameState; actions: GameActions };

export function StaffTab({ state, actions }: Props) {
  return (
    <section id="tab-employees" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Mitarbeiter</h2>
          <span className="hint">Stelle Angestellte ein, um Aufgaben zu automatisieren</span>
        </div>
        <div className="upgrade-list">
          {EMPLOYEES.map((emp) => {
            const data = (state.employees as any)[emp.id] || {};
            const hired = !!data.hired;
            const level = data.level || 1;
            const upgradeCost = Math.round(emp.salary * level * 2);
            const eligible = state.level >= (emp.reqLevel || 1);
            const energy = Math.round(data.energy ?? 0);
            const resting = !!data.resting;
            return (
              <div key={emp.id} className="employee-card">
                <div className="employee-info">
                  <div className="employee-name">
                    {emp.name} {hired ? `(Lv.${level})` : ''}
                  </div>
                  <div className="employee-desc">{emp.desc}</div>
                  <div className="employee-details">
                    Gehalt: {fmtNumber(emp.salary)}/Monat · Aufgaben: {emp.tasks.join(', ')}
                  </div>
                  {hired && (
                    <div className="employee-energy">
                      <div className="bar-label">Energie {energy}% {resting ? '· Pause' : ''}</div>
                      <div className="progress">
                        <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, energy))}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="employee-actions">
                    {!hired ? (
                      <button className="secondary" onClick={() => actions.hireEmployee(emp.id)} disabled={!eligible || state.cash < emp.salary}>
                        {eligible ? 'Einstellen' : `Gesperrt (Lvl ${emp.reqLevel})`}
                      </button>
                    ) : (
                      <>
                        <button className="accent" onClick={() => actions.upgradeEmployee(emp.id)} disabled={state.grams < upgradeCost}>
                          Upgrade ({fmtNumber(upgradeCost)}g)
                        </button>
                        <button className="ghost" onClick={() => actions.fireEmployee(emp.id)}>
                          Kündigen
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Apotheken-Verträge</h2>
          <span className="hint">Liefere monatlich Ware</span>
        </div>
        <div className="jobs-grid">
          {state.level < 6 && <div className="placeholder">Dieses Feature wird mit Level 6 freigeschaltet.</div>}
          {state.level >= 6 &&
            APOTHEKEN_VERTRAEGE.map((vertrag) => {
              const hired = !!state.apothekenVertraege[vertrag.id];
              const eligible = state.level >= (vertrag.reqLevel || 1);
              return (
                <div key={vertrag.id} className={`job-card ${hired ? 'job-card-active' : ''} ${!eligible ? 'job-card-locked' : ''}`}>
                  <div className="job-title">{vertrag.name}</div>
                  <div className="job-salary">{fmtNumber(vertrag.monthlyCash)}/Monat</div>
                  <div className="job-desc">{vertrag.desc}</div>
                  <div className="job-tags">Lieferung: {vertrag.monthlyGrams}g/Monat</div>
                  <div className="job-meta">Vertragskosten: {fmtNumber(vertrag.costToHire)}</div>
                  <div className="jobs-card-actions">
                    {!hired ? (
                      <button className="secondary" onClick={() => actions.buyContract(vertrag.id)} disabled={!eligible || state.cash < vertrag.costToHire}>
                        {eligible ? 'Vertrag abschließen' : `Gesperrt (Lvl ${vertrag.reqLevel})`}
                      </button>
                    ) : (
                      <button className="ghost" onClick={() => actions.fireContract(vertrag.id)}>
                        Vertrag kündigen
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
