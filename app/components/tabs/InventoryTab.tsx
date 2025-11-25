'use client';

import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { CONSUMABLE_PACKS, ITEMS } from '@/lib/game/data';
import { fmtNumber } from '@/lib/game/utils';
import { getAllStrains, itemCost, seedCost } from '@/lib/game/engine';
import { Tooltip } from '../ui/Tooltip';

type Props = {
  state: GameState;
  actions: GameActions;
};

type InventoryRow = {
  id: string;
  name: string;
  kind: 'seed' | 'item' | 'consumable';
  qty: number;
  value: number;
  desc?: string;
  rarity?: string;
  effects?: string[];
};

export function InventoryTab({ state, actions }: Props) {
  const filter = state.inventoryFilter || 'all';
  const sort = (state.inventorySort as 'name' | 'value' | 'rarity' | 'qty') || 'name';

  const rows: InventoryRow[] = [];
  const strains = getAllStrains(state);
  for (const [id, qty] of Object.entries(state.seeds || {})) {
    const strain = strains.find((s) => s.id === id);
    const effects = [];
    if (strain?.yield) effects.push(`Ertrag: ~${fmtNumber(strain.yield)}g`);
    if (strain?.grow) effects.push(`Wachstum: ${Math.round(strain.grow)}s`);
    if (strain?.quality) effects.push(`Qualität x${strain.quality}`);
    rows.push({
      id,
      name: strain?.name || id,
      kind: 'seed',
      qty,
      value: seedCost(state, id),
      desc: strain?.desc,
      rarity: strain?.rarity,
      effects
    });
  }
  const formatEffects = (eff: any = {}) => {
    const res: string[] = [];
    if (eff.priceMult) res.push(`Preis +${Math.round((eff.priceMult - 1) * 100)}%`);
    if (eff.yieldMult) res.push(`Ertrag +${Math.round((eff.yieldMult - 1) * 100)}%`);
    if (eff.growthMult) res.push(`Wachstum +${Math.round((eff.growthMult - 1) * 100)}%`);
    if (eff.qualityMult) res.push(`Qualität +${Math.round((eff.qualityMult - 1) * 100)}%`);
    if (eff.nutrientBoost) res.push(`Nährstoffe +${Math.round(eff.nutrientBoost * 100)}%`);
    if (eff.offerSlot) res.push(`+${eff.offerSlot} Angebot`);
    if (eff.spawnDelta) res.push(`Spawn -${eff.spawnDelta}s`);
    if (eff.pestReduce) {
      const parts = Object.entries(eff.pestReduce).map(([k, v]) => `${k} -${Math.round((1 - (v as number)) * 100)}%`);
      res.push(`Schädlinge: ${parts.join(', ')}`);
    }
    return res;
  };

  for (const item of ITEMS) {
    const qty = state.itemsOwned[item.id] || 0;
    rows.push({
      id: item.id,
      name: item.name,
      kind: 'item',
      qty,
      value: itemCost(state, item.id),
      desc: item.desc,
      rarity: item.rarity || 'common',
      effects: formatEffects(item.effects)
    });
  }
  for (const pack of CONSUMABLE_PACKS) {
    const qty =
      (pack.add.water || 0) +
      (pack.add.nutrient || 0) +
      (pack.add.spray || 0) +
      (pack.add.fungicide || 0) +
      (pack.add.beneficials || 0) +
      (pack.add.coffee || 0);
    rows.push({
      id: pack.id,
      name: pack.name,
      kind: 'consumable',
      qty,
      value: pack.price,
      desc: pack.desc,
      rarity: 'common',
      effects: formatEffects(pack.add)
    });
  }

  const filtered = rows.filter((r) => (filter === 'all' ? true : r.kind === filter));
  filtered.sort((a, b) => {
    if (sort === 'value') return b.value - a.value;
    if (sort === 'qty') return (b.qty || 0) - (a.qty || 0);
    if (sort === 'rarity') {
      const order = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
      const ra = order.indexOf((a as any).rarity || '');
      const rb = order.indexOf((b as any).rarity || '');
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <section id="tab-inventory" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Inventar</h2>
          <span className="hint">Verwalte deine Gegenstände</span>
        </div>
        <div className="inventory-toolbar">
          <div className="inventory-tabs">
            <button className={`inv-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters('all', sort)}>
              Alle
            </button>
            <button className={`inv-tab ${filter === 'item' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters('item', sort)}>
              Ausrüstung
            </button>
            <button className={`inv-tab ${filter === 'seed' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters('seed', sort)}>
              Samen
            </button>
            <button className={`inv-tab ${filter === 'consumable' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters('consumable', sort)}>
              Verbrauch
            </button>
          </div>
          <div className="chip-group" id="inventorySort">
            <button className={`chip small ${sort === 'name' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters(filter, 'name')}>
              Name
            </button>
            <button className={`chip small ${sort === 'rarity' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters(filter, 'rarity')}>
              Rarität
            </button>
            <button className={`chip small ${sort === 'qty' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters(filter, 'qty')}>
              Menge
            </button>
            <button className={`chip small ${sort === 'value' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters(filter, 'value')}>
              Wert
            </button>
          </div>
        </div>
        <div className="inventory-grid">
          {filtered.length === 0 && <div className="placeholder slot-placeholder">Noch nichts gesammelt.</div>}
          {filtered.map((row) => {
            const rarity = (row.rarity || 'common').toLowerCase();
            const tooltip = (
              <div className="inv-tooltip">
                <div className="inv-tip-name">{row.name}</div>
                <div className="inv-tip-kind">{row.kind === 'seed' ? 'Samen' : row.kind === 'item' ? 'Ausrüstung' : 'Verbrauch'}</div>
                {row.desc && <div className="inv-tip-desc">{row.desc}</div>}
                {row.effects && row.effects.length > 0 && (
                  <div className="inv-tip-effects">
                    {row.effects.map((e, i) => (
                      <div key={i}>• {e}</div>
                    ))}
                  </div>
                )}
                <div className="inv-tip-value">Wert: {fmtNumber(row.value)} $</div>
              </div>
            );
            return (
              <Tooltip key={`${row.kind}-${row.id}`} content={tooltip}>
                <div className={`inventory-slot rarity-${rarity}`}>
                  <div className="slot-top">
                    <span className="slot-kind">{row.kind === 'seed' ? 'Samen' : row.kind === 'item' ? 'Gear' : 'Verbrauch'}</span>
                    <span className="slot-qty">x{row.qty}</span>
                  </div>
                  <div className="slot-name">{row.name}</div>
                  <div className="slot-desc">{row.desc}</div>
                  {row.effects && row.effects.length > 0 && <div className="slot-effects">{row.effects.join(' · ')}</div>}
                  <div className="slot-footer">
                    <span className="slot-value">{fmtNumber(row.value)} $</span>
                    {row.kind === 'seed' && actions.toggleFavorite && (
                      <button className="chip tiny" type="button" onClick={() => actions.toggleFavorite!(row.id)}>
                        {state.favorites?.includes(row.id) ? '★ Favorit' : '☆ Favorit'}
                      </button>
                    )}
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </section>
  );
}
