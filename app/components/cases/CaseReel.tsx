'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildCaseConfigs, STRAINS } from '@/lib/game/data';
import { Strain } from '@/lib/game/types';

type Props = {
  caseId: string;
  winningStrainId?: string;
  spinTrigger?: number;
  onFinished?: () => void;
};

const CASE_REEL_BEFORE = 56;
const CASE_REEL_AFTER = 30;
const CARD_WIDTH = 180;
const CARD_GAP = 14;
const STEP = CARD_WIDTH + CARD_GAP;

export function CaseReel({ caseId, winningStrainId, spinTrigger, onFinished }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const config = useMemo(() => {
    const cfgs = buildCaseConfigs(STRAINS);
    return cfgs.find((c) => c.id === caseId) || cfgs[0];
  }, [caseId]);

  const lootPool = useMemo(() => (config ? config.lootBuilder() : []), [config]);

  const pickCaseLoot = () => {
    if (!lootPool.length) return null;
    const total = lootPool.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (total <= 0) return { ...lootPool[Math.floor(Math.random() * lootPool.length)] };
    let roll = Math.random() * total;
    for (const item of lootPool) {
      roll -= item.weight || 0;
      if (roll <= 0) return { ...item };
    }
    return { ...lootPool[lootPool.length - 1] };
  };

  const shuffle = (arr: any[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const generateCaseSequence = (length: number) => {
    if (!lootPool.length || length <= 0) return [];
    const seq: any[] = [];
    let unique = shuffle(lootPool.map((item) => ({ ...item })));
    while (seq.length < length) {
      if (unique.length) {
        seq.push({ ...unique.shift()! });
      } else {
        const pick = pickCaseLoot();
        if (pick) seq.push({ ...pick });
      }
    }
    return seq;
  };

  const reelSequence = useMemo(() => {
    const beforeCount = Math.max(CASE_REEL_BEFORE, lootPool.length + 12);
    const afterCount = Math.max(CASE_REEL_AFTER, Math.ceil(lootPool.length / 2));
    const beforeSeq = generateCaseSequence(beforeCount);
    const afterSeq = generateCaseSequence(afterCount);
    const winningMeta =
      winningStrainId && lootPool.find((l) => l.strainId === winningStrainId)
        ? { ...(lootPool.find((l) => l.strainId === winningStrainId) as any) }
        : pickCaseLoot() || lootPool[0];
    const winIndex = beforeSeq.length;
    const seq = [...beforeSeq, winningMeta, ...afterSeq];
    return { seq, winIndex };
  }, [lootPool, winningStrainId, caseId]);

  useEffect(() => {
    if (!spinTrigger) {
      setSpinning(false);
      setOffset(0);
      return;
    }
    const { winIndex, seq } = reelSequence;
    if (!reelRef.current || !viewportRef.current || seq.length === 0) return;
    const viewportW = viewportRef.current.clientWidth || STEP;
    const target = winIndex * STEP - viewportW / 2 + STEP / 2;
    setSpinning(true);
    setOffset(-target);
    const timer = setTimeout(() => {
      setSpinning(false);
      onFinished?.();
    }, 3800);
    return () => clearTimeout(timer);
  }, [reelSequence, spinTrigger, onFinished]);

  return (
    <div className="cases-reel-panel">
      <div className="cases-indicator" aria-hidden="true" />
      <div className="cases-reel-viewport" ref={viewportRef}>
        <div
          ref={reelRef}
          className={`cases-reel ${spinning ? 'cases-reel--spinning' : ''}`}
          style={{
            transform: `translate3d(${offset}px, 0, 0)`,
            transition: spinning ? 'transform 3.6s cubic-bezier(.14,.67,.12,1.02)' : 'none'
          }}
        >
          {reelSequence.seq.map((item: any, idx: number) => (
            <CaseCard key={`${idx}-${item.strainId}`} strainId={item.strainId} rarity={item.rarity} highlight={idx === reelSequence.winIndex} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CaseCard({ strainId, rarity, highlight }: { strainId: string; rarity: string; highlight?: boolean }) {
  const strain = (STRAINS as Strain[]).find((s) => s.id === strainId) || STRAINS[0];
  return (
    <div className={`cases-card ${highlight ? 'cases-card--winner' : ''}`} data-rarity={rarity}>
      <span className="cases-card-tag">{(strain.tag || '❓').toUpperCase()}</span>
      <span className="cases-card-name">{strain.name || strainId}</span>
    </div>
  );
}
