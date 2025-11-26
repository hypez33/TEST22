'use client';

import { Strain } from '@/lib/game/types';
import { fmtNumber } from '@/lib/game/utils';
import { Tooltip } from '../ui/Tooltip';

type Props = {
  strain: Strain;
  onClose: () => void;
};

const rarityClass = (rarity?: string) => `rarity-${(rarity || 'common').toLowerCase()}`;

const isLucky = (strain: Strain) =>
  !!(strain.traits || []).find((t) => t.id === 'lucky_hit') || strain.yield > 1.4 * 1000;

export function BreedingResultModal({ strain, onClose }: Props) {
  const lucky = isLucky(strain);
  const stats = [
    { label: 'Ertrag', value: `${fmtNumber(strain.yield)} g` },
    { label: 'Qualität', value: strain.quality.toFixed(2) },
    { label: 'Wachstum', value: `${fmtNumber(strain.grow)} s` }
  ];

  return (
    <div className="modal-backdrop">
      <div className={`breeding-modal ${rarityClass(strain.rarity)}`}>
        <div className="radiant-bg" />
        <div className="modal-head">
          <div className="title-row">
            <h2 className="strain-name">{strain.name}</h2>
            <span className={`pill rarity-pill ${rarityClass(strain.rarity)}`}>{strain.rarity}</span>
          </div>
          {lucky && <div className="lucky-burst">LUCKY HIT! 🎉</div>}
          <div className="lineage">{strain.lineage ? `${strain.lineage.p1} × ${strain.lineage.p2}` : 'Neue Kreuzung'}</div>
        </div>
        <div className="stats-row">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>
        {strain.traits && strain.traits.length > 0 && (
          <div className="trait-row">
            <div className="label">Traits</div>
            <div className="trait-list">
              {strain.traits.map((t) => (
                <Tooltip key={t.id} content={`${t.name}: ${t.desc}`}>
                  <span className={`trait-badge ${t.isNegative ? 'negative' : ''}`}>{t.name.slice(0, 2)}</span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
        <div className="actions">
          <button className="accent" onClick={onClose}>
            Behalten & schließen
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .breeding-modal {
          position: relative;
          background: linear-gradient(135deg, #1a1a1f, #222230);
          border: 2px solid gold;
          border-radius: 14px;
          padding: 20px 24px;
          overflow: hidden;
          width: min(640px, 90vw);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
        }
        .radiant-bg {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle, rgba(255, 215, 120, 0.22) 0%, rgba(255, 215, 120, 0) 60%);
          pointer-events: none;
          animation: pulse 3s infinite alternate;
        }
        @keyframes pulse {
          from {
            opacity: 0.55;
          }
          to {
            opacity: 0.9;
          }
        }
        .modal-head {
          position: relative;
          z-index: 1;
          margin-bottom: 12px;
        }
        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: space-between;
        }
        .strain-name {
          margin: 0;
          font-size: 1.7rem;
          letter-spacing: 0.5px;
        }
        .rarity-pill {
          text-transform: uppercase;
          font-weight: 700;
        }
        .lineage {
          font-size: 0.95rem;
          opacity: 0.8;
        }
        .lucky-burst {
          margin-top: 6px;
          padding: 8px 12px;
          background: linear-gradient(90deg, #ffd166, #ff7b7b);
          color: #1a1a1a;
          font-weight: 800;
          border-radius: 8px;
          text-align: center;
          animation: pop 0.6s ease-out;
        }
        @keyframes pop {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .stats-row {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin: 14px 0;
        }
        .stat-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 215, 120, 0.25);
          padding: 10px 12px;
          border-radius: 10px;
        }
        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }
        .stat-value {
          font-size: 1.3rem;
          font-weight: 700;
        }
        .trait-row {
          position: relative;
          z-index: 1;
          margin: 10px 0;
        }
        .trait-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .trait-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 4px 7px;
          border-radius: 6px;
          font-size: 0.8rem;
        }
        .trait-badge.negative {
          border-color: #f66;
          color: #f99;
        }
        .actions {
          position: relative;
          z-index: 1;
          margin-top: 12px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
