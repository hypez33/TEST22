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

const getStatColor = (label: string): string => {
  if (label === 'Ertrag') return '#4ade80';
  if (label === 'Qualität') return '#60a5fa';
  if (label === 'Wachstum') return '#fbbf24';
  return '#fff';
};

export function BreedingResultModal({ strain, onClose }: Props) {
  const lucky = isLucky(strain);
  const stats = [
    { label: 'Ertrag', value: `${fmtNumber(strain.yield)} g`, icon: '🌿' },
    { label: 'Qualität', value: strain.quality.toFixed(2), icon: '⭐' },
    { label: 'Wachstum', value: `${fmtNumber(strain.grow)} s`, icon: '⚡' }
  ];

  const traitCount = strain.traits?.length || 0;
  const negativeTraits = strain.traits?.filter(t => t.isNegative).length || 0;
  const positiveTraits = traitCount - negativeTraits;

  return (
    <div className="modal-backdrop">
      <div className={`breeding-modal ${rarityClass(strain.rarity)}`}>
        <div className="radiant-bg" />
        
        <div className="modal-head">
          <div className="title-row">
            <div>
              <h2 className="strain-name">{strain.name}</h2>
              <div className="lineage">
                {strain.lineage ? `${strain.lineage.p1} × ${strain.lineage.p2}` : 'Neue Kreuzung'}
              </div>
            </div>
            <span className={`pill rarity-pill ${rarityClass(strain.rarity)}`}>
              {strain.rarity.toUpperCase()}
            </span>
          </div>
          {lucky && <div className="lucky-burst">✨ LUCKY HIT! 🎉</div>}
        </div>

        <div className="stats-row">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: getStatColor(s.label) }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {traitCount > 0 && (
          <div className="trait-section">
            <div className="trait-header">
              <span className="trait-title">Traits ({positiveTraits}/{traitCount})</span>
              {negativeTraits > 0 && <span className="negative-count">⚠️ {negativeTraits} Risiko</span>}
            </div>
            <div className="trait-list">
              {(strain.traits || []).map((t) => (
                <Tooltip key={t.id} content={`${t.name}: ${t.desc}`}>
                  <span className={`trait-badge ${t.isNegative ? 'negative' : 'positive'}`}>
                    {t.isNegative ? '✗' : '✓'} {t.name}
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        <div className="actions">
          <button className="accent" onClick={onClose}>
            Behalten & Schließen
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
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .breeding-modal {
          position: relative;
          background: linear-gradient(135deg, #1a1a1f, #222230);
          border: 2px solid gold;
          border-radius: 14px;
          padding: 24px;
          overflow: hidden;
          width: min(680px, 90vw);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(255, 215, 0, 0.15);
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
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
          margin-bottom: 18px;
        }

        .title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .strain-name {
          margin: 0;
          font-size: 1.8rem;
          letter-spacing: 0.5px;
          font-weight: 800;
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lineage {
          font-size: 0.9rem;
          opacity: 0.7;
          margin-top: 4px;
          color: #bbb;
        }

        .rarity-pill {
          text-transform: uppercase;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.4);
          white-space: nowrap;
        }

        .lucky-burst {
          margin-top: 10px;
          padding: 10px 14px;
          background: linear-gradient(90deg, #ffd166, #ff7b7b);
          color: #1a1a1a;
          font-weight: 800;
          border-radius: 8px;
          text-align: center;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
          animation: pop 0.6s ease-out;
          box-shadow: 0 4px 16px rgba(255, 123, 123, 0.3);
        }

        @keyframes pop {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
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
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin: 20px 0;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 215, 120, 0.2);
          padding: 14px 12px;
          border-radius: 10px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 215, 120, 0.5);
          transform: scaleX(0);
          transform-origin: left;
          animation: slideIn 0.6s ease-out forwards;
        }

        @keyframes slideIn {
          to {
            transform: scaleX(1);
          }
        }

        .stat-icon {
          font-size: 1.8rem;
          margin-bottom: 6px;
        }

        .stat-label {
          font-size: 0.85rem;
          opacity: 0.7;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 1.4rem;
          font-weight: 700;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .trait-section {
          position: relative;
          z-index: 1;
          margin: 16px 0;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 215, 120, 0.2);
        }

        .trait-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .trait-title {
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.85;
        }

        .negative-count {
          font-size: 0.8rem;
          color: #ff9999;
          font-weight: 600;
        }

        .trait-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .trait-badge {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: help;
          white-space: nowrap;
        }

        .trait-badge.positive {
          border-color: rgba(74, 222, 128, 0.4);
          color: #4ade80;
          background: rgba(74, 222, 128, 0.08);
        }

        .trait-badge.negative {
          border-color: rgba(255, 107, 107, 0.4);
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.08);
        }

        .trait-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .actions {
          position: relative;
          z-index: 1;
          margin-top: 18px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .accent {
          padding: 10px 24px;
          background: linear-gradient(135deg, #ffd700, #ffb700);
          color: #1a1a1a;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
        }

        .accent:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(255, 215, 0, 0.4);
        }

        .accent:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
