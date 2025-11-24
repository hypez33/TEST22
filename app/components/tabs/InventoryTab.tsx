'use client';

import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { CONSUMABLE_PACKS, ITEMS } from '@/lib/game/data';
import { fmtNumber } from '@/lib/game/utils';
import { getAllStrains, itemCost, seedCost } from '@/lib/game/engine';

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
};

export function InventoryTab({ state, actions }: Props) {
  const filter = state.inventoryFilter || 'all';
  const sort = (state.inventorySort as 'name' | 'value' | 'rarity' | 'qty') || 'name';

  const rows: InventoryRow[] = [];
  const strains = getAllStrains(state);
  for (const [id, qty] of Object.entries(state.seeds || {})) {
    const strain = strains.find((s) => s.id === id);
    rows.push({ id, name: strain?.name || id, kind: 'seed', qty, value: seedCost(state, id), desc: strain?.desc, rarity: strain?.rarity });
  }
  for (const item of ITEMS) {
    const qty = state.itemsOwned[item.id] || 0;
    rows.push({ id: item.id, name: item.name, kind: 'item', qty, value: itemCost(state, item.id), desc: item.desc });
  }
  for (const pack of CONSUMABLE_PACKS) {
    const qty =
      (pack.add.water || 0) +
      (pack.add.nutrient || 0) +
      (pack.add.spray || 0) +
      (pack.add.fungicide || 0) +
      (pack.add.beneficials || 0) +
      (pack.add.coffee || 0);
    rows.push({ id: pack.id, name: pack.name, kind: 'consumable', qty, value: pack.price, desc: pack.desc });
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
          <div className="chip-group" id="inventoryFilter">
            <button className={`chip small ${filter === 'all' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters('all', sort)}>
              Alle
            </button>
            <button className={`chip small ${filter === 'item' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters('item', sort)}>
              Ausrüstung
            </button>
            <button className={`chip small ${filter === 'seed' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters('seed', sort)}>
              Samen
            </button>
            <button className={`chip small ${filter === 'consumable' ? 'active' : ''}`} onClick={() => actions.setInventoryFilters('consumable', sort)}>
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
        <div className="inventory-list">
          {filtered.length === 0 && <div className="placeholder">Noch nichts gesammelt.</div>}
          {filtered.map((row) => (
            <div key={`${row.kind}-${row.id}`} className="inventory-item">
              <Tooltip content={row.desc || row.name}>
                <div className="inventory-name">
                  {row.name} <span className="pill muted">{row.kind}</span>
                </div>
              </Tooltip>
              <div className="inventory-desc">{row.desc}</div>
              <div className="inventory-meta">
                <span>Menge: {row.qty}</span>
                <span>Wert: {fmtNumber(row.value)}</span>
                {row.kind === 'seed' && actions.toggleFavorite && (
                  <button className="chip small" type="button" onClick={() => actions.toggleFavorite!(row.id)}>
                    Favorit {state.favorites?.includes(row.id) ? '★' : '☆'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
