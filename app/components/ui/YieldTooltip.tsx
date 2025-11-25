'use client';

import { fmtNumber, formatPercent } from '@/lib/game/utils';

type Breakdown = {
  base: number;
  flowerBonus: number;
  levelMult: number;
  researchMult: number;
  globalMult: number;
  mastery: number;
  timing: number;
  event: number;
  cap: number;
  appliedCap?: boolean;
};

type Props = {
  breakdown: Breakdown;
  qualityMult: number;
};

export function YieldTooltip({ breakdown, qualityMult }: Props) {
  const rows = [
    { label: 'Basis', value: `${fmtNumber(breakdown.base)} g` },
    { label: 'Blüteprogress', value: formatPercent(breakdown.flowerBonus - 1) },
    { label: 'Level', value: formatPercent(breakdown.levelMult - 1) },
    { label: 'Research', value: formatPercent(breakdown.researchMult - 1) },
    { label: 'Global/Upgrades', value: formatPercent(breakdown.globalMult - 1) },
    { label: 'Mastery', value: formatPercent(breakdown.mastery - 1) },
    { label: 'Timing', value: formatPercent(breakdown.timing - 1) },
    { label: 'Event', value: formatPercent(breakdown.event - 1) },
    { label: 'Qualität', value: formatPercent(qualityMult - 1) }
  ];
  return (
    <div className="yield-tooltip">
      <div className="yield-tip-title">Ertragsfaktoren</div>
      <div className="yield-tip-grid">
        {rows.map((r) => (
          <div key={r.label} className="yield-tip-row">
            <span>{r.label}</span>
            <span>{r.value}</span>
          </div>
        ))}
      </div>
      <div className="yield-tip-cap">
        Cap: {fmtNumber(breakdown.cap)} g {breakdown.appliedCap ? '(begrenzt)' : ''}
      </div>
    </div>
  );
}
