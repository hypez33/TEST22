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
};

export function InventoryTab({ state, actions }: Props) {
  const filter = state.inventoryFilter || 'all';
  const sort = state.inventorySort || 'name';

  const rows: InventoryRow[] = [];
  const strains = getAllStrains(state);
  for (const [id, qty] of Object.entries(state.seeds || {})) {
    const strain = strains.find((s) => s.id === id);
    rows.push({ id, name: strain?.name || id, kind: 'seed', qty, value: seedCost(state, id), desc: strain?.desc });
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
      (pack.add.beneficials || 0);
    rows.push({ id: pack.id, name: pack.name, kind: 'consumable', qty, value: pack.price, desc: pack.desc });
  }

  const filtered = rows.filter((r) => (filter === 'all' ? true : r.kind === filter));
  filtered.sort((a, b) => {
    if (sort === 'value') return b.value - a.value;
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
              A-Z
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
              <div className="inventory-name">
                {row.name} <span className="pill muted">{row.kind}</span>
              </div>
              <div className="inventory-desc">{row.desc}</div>
              <div className="inventory-meta">
                <span>Menge: {row.qty}</span>
                <span>Wert: {fmtNumber(row.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
