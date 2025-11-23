import { useMemo, useState } from 'react';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { CONSUMABLE_PACKS, ITEMS } from '@/lib/game/data';
import { fmtNumber } from '@/lib/game/utils';
import { getAllStrains, itemCost, seedCost } from '@/lib/game/engine';

type Props = {
  state: GameState;
  actions: GameActions;
};

const SHOP_TABS = [
  { id: 'seeds', label: '🌱 Samen' },
  { id: 'tools', label: '🛠️ Werkzeuge & Gear' },
  { id: 'consumables', label: '🧪 Verbrauch' }
];

export function ShopTab({ state, actions }: Props) {
  const [tab, setTab] = useState('seeds');
  const strains = useMemo(() => getAllStrains(state), [state]);

  return (
    <section id="tab-trade" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>🛒 Growmarkt</h2>
          <div className="shop-header-actions">
            <div className="shop-tabs">
              {SHOP_TABS.map((t) => (
                <button key={t.id} className={`shop-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="shop-cart-button">
              <i className="fi fi-rr-shopping-cart"></i>
              <span>Bargeld: {fmtNumber(state.cash)}</span>
            </div>
          </div>
        </div>
        <div className="shop-list">
          {tab === 'seeds' && (
            <div className="shop-category active">
              {strains.map((strain) => {
                const price = seedCost(state, strain.id);
                const count = state.seeds[strain.id] || 0;
                const purchased = state.purchasedCount[strain.id] || 0;
                return (
                  <div key={strain.id} className="shop-item">
                    <div className="shop-item-left">
                      <div className="shop-item-name">
                        {strain.name}{' '}
                        <span className="pill muted" data-rarity={strain.rarity}>
                          {strain.rarity}
                        </span>
                      </div>
                      <div className="shop-item-desc">{strain.desc}</div>
                      <div className="shop-item-meta">Im Inventar: {count} • gekauft: {purchased}</div>
                    </div>
                    <div className="shop-item-right">
                      <div className="shop-item-price">
                        <span className="coin-text">
                          <img src="/assets/coin.png" alt="" className="coin-icon" /> {fmtNumber(price)}
                        </span>
                      </div>
                      <button className="accent" type="button" onClick={() => actions.buySeed(strain.id)} disabled={state.cash < price}>
                        Kaufen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'tools' && (
            <div className="shop-category active">
              {ITEMS.map((item) => {
                const owned = state.itemsOwned[item.id] || 0;
                const price = itemCost(state, item.id);
                return (
                  <div key={item.id} className="shop-item">
                    <div className="shop-item-left">
                      <div className="shop-item-name">
                        {item.name} <span className="pill muted">{item.category}</span>
                      </div>
                      <div className="shop-item-desc">{item.desc}</div>
                      <div className="shop-item-meta">Besitz: {owned}</div>
                    </div>
                    <div className="shop-item-right">
                      <div className="shop-item-price">
                        <span className="coin-text">
                          <img src="/assets/coin.png" alt="" className="coin-icon" /> {fmtNumber(price)}
                        </span>
                      </div>
                      <button className="secondary" type="button" onClick={() => actions.buyItem(item.id)} disabled={state.cash < price}>
                        Kaufen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'consumables' && (
            <div className="shop-category active">
              {CONSUMABLE_PACKS.map((pack) => (
                <div key={pack.id} className="shop-item">
                  <div className="shop-item-left">
                    <div className="shop-item-name">{pack.name}</div>
                    <div className="shop-item-desc">{pack.desc}</div>
                  </div>
                  <div className="shop-item-right">
                    <div className="shop-item-price">
                      <span className="coin-text">
                        <img src="/assets/coin.png" alt="" className="coin-icon" /> {fmtNumber(pack.price)}
                      </span>
                    </div>
                    <button className="secondary" type="button" onClick={() => actions.buyPack(pack.id)} disabled={state.cash < pack.price}>
                      Kaufen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
