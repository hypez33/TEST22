'use client';

import { GameState, ProcessedBatch } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { fmtNumber, formatTimer } from '@/lib/game/utils';

type Props = { state: GameState; actions: GameActions };

const asProcessing = (state: GameState) => {
  const proc = state.processing || { wet: [], drying: [], curing: [], ready: [], slots: { drying: 2, curing: 2 } };
  return {
    wet: proc.wet || [],
    drying: proc.drying || [],
    curing: proc.curing || [],
    ready: proc.ready || [],
    slots: proc.slots || { drying: 2, curing: 2 }
  };
};

export function ProcessingTab({ state, actions }: Props) {
  const proc = asProcessing(state);
  const wet = proc.wet;
  const drying = proc.drying;
  const curing = proc.curing;
  const ready = proc.ready;
  const dryingSlots = proc.slots.drying || 0;
  const curingSlots = proc.slots.curing || 0;
  const dryingFree = Math.max(0, dryingSlots - drying.length);
  const curingFree = Math.max(0, curingSlots - curing.length);
  const rosinCandidates = ready.filter((r) => (r.quality || 0) < 1);

  return (
    <section className="tab processing-tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Verarbeitung</h2>
          <span className="hint">Vom Nass-Trim zum Cure</span>
        </div>
        <div className="processing-summary">
          <SummaryPill label="Nasslager" value={`${wet.length} Batch${wet.length === 1 ? '' : 'es'}`} icon="fi fi-sr-raindrops" />
          <SummaryPill label="Trocknungsnetze" value={`${drying.length}/${dryingSlots}`} icon="fi fi-sr-wind" />
          <SummaryPill label="Curing-Gläser" value={`${curing.length}/${curingSlots}`} icon="fi fi-sr-flask" />
          <SummaryPill label="Abpackbereit" value={`${ready.length}`} icon="fi fi-sr-check" />
          <SummaryPill label="Konzentrate" value={`${fmtNumber(state.concentrates || 0)} g`} icon="fi fi-sr-dna" />
          <div className="processing-actions">
            <button className="ghost" type="button" onClick={() => actions.startDrying()} disabled={dryingFree <= 0 || wet.length === 0}>
              Freie Netze füllen ({dryingFree})
            </button>
            <button className="ghost" type="button" onClick={() => actions.collectAllProcessed()} disabled={ready.length === 0}>
              Alles abpacken
            </button>
          </div>
        </div>
      </div>

      <div className="processing-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Nasse Blüten</h3>
            <span className="hint">Geerntet, warten aufs Netz</span>
          </div>
          <div className="process-list">
            {wet.length === 0 && <div className="placeholder">Kein Nassmaterial wartet.</div>}
            {wet.map((b) => (
              <ProcessCard
                key={b.id}
                batch={b}
                stageLabel="Nass"
                meta={`Qualität x${b.quality.toFixed(2)}`}
                actions={
                  <button className="ghost" type="button" disabled={dryingFree <= 0} onClick={() => actions.startDrying(b.id)}>
                    In Netz legen
                  </button>
                }
              />
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Trocknungsnetze</h3>
            <span className="hint">Feuchtigkeit raus, Preis rauf</span>
          </div>
          <div className="process-list grid">
            {Array.from({ length: dryingSlots }).map((_, idx) => {
              const job = drying[idx];
              if (!job) {
                return (
                  <div key={idx} className="process-slot empty">
                    <div className="slot-label">Slot {idx + 1}</div>
                    <div className="slot-empty">Frei</div>
                  </div>
                );
              }
              const progress = 1 - job.remaining / (job.total || 1);
              return (
                <div key={job.id} className="process-slot active">
                  <div className="slot-label">Slot {idx + 1}</div>
                  <div className="slot-title">{fmtNumber(job.wetGrams)} g Nass</div>
                  <div className="slot-meta">Qualität x{job.quality.toFixed(2)}</div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
                  </div>
                  <div className="slot-meta">Trocknet... {formatTimer(job.remaining)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Curing-Gläser</h3>
            <span className="hint">Langsam reifen für maximale Qualität</span>
          </div>
          <div className="process-list grid">
            {Array.from({ length: curingSlots }).map((_, idx) => {
              const job = curing[idx];
              if (!job) {
                return (
                  <div key={idx} className="process-slot empty">
                    <div className="slot-label">Glas {idx + 1}</div>
                    <div className="slot-empty">Wartet auf Batch</div>
                  </div>
                );
              }
              const progress = 1 - job.remaining / (job.total || 1);
              return (
                <div key={job.id} className="process-slot active">
                  <div className="slot-label">Glas {idx + 1}</div>
                  <div className="slot-title">{fmtNumber(job.grams)} g</div>
                  <div className="slot-meta">
                    Qualität {job.quality.toFixed(2)} → {job.targetQuality.toFixed(2)}
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
                  </div>
                  <div className="slot-meta">Reift... {formatTimer(job.remaining)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Abpackbereit</h3>
            <span className="hint">Fertig getrocknet oder gecured</span>
          </div>
          <div className="process-list">
            {ready.length === 0 && <div className="placeholder">Noch nichts fertig.</div>}
            {ready.map((b) => (
              <ProcessCard
                key={b.id}
                batch={b}
                stageLabel={b.stage === 'cured' ? 'Cured' : 'Trocken'}
                meta={`Qualität x${b.quality.toFixed(2)}`}
                actions={
                  <>
                    {b.stage === 'dry' && (
                      <button className="ghost" type="button" disabled={curingFree <= 0} onClick={() => actions.startCuring(b.id)}>
                        In Glas packen
                      </button>
                    )}
                    <button className="accent" type="button" onClick={() => actions.collectProcessed(b.id)}>
                      Abpacken
                    </button>
                  </>
                }
              />
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Rosin-Presse</h3>
            <span className="hint">Schlechte Batches in Konzentrate verwandeln</span>
          </div>
          <div className="process-list">
            {rosinCandidates.length === 0 && <div className="placeholder">Keine schwachen Batches zum Pressen.</div>}
            {rosinCandidates.map((b) => (
              <ProcessCard
                key={`rosin-${b.id}`}
                batch={b}
                stageLabel="Pressbar"
                meta={`Qualität x${b.quality.toFixed(2)}`}
                actions={
                  <button className="accent" type="button" onClick={() => actions.pressRosin(b.id)}>
                    Pressen
                  </button>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryPill({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="summary-pill">
      <div className="pill-label">
        <i className={icon} aria-hidden="true" /> {label}
      </div>
      <div className="pill-value">{value}</div>
    </div>
  );
}

function ProcessCard({ batch, stageLabel, meta, actions }: { batch: ProcessedBatch; stageLabel: string; meta?: string; actions?: React.ReactNode }) {
  return (
    <div className="process-card">
      <div className="process-title">
        <span className="pill muted">{stageLabel}</span>
        <strong>{fmtNumber(batch.grams)} g</strong>
      </div>
      <div className="process-meta">{meta}</div>
      {actions && <div className="process-buttons">{actions}</div>}
    </div>
  );
}
