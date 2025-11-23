'use client';

import { useState } from 'react';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { CONSUMABLE_PACKS, ITEMS } from '@/lib/game/data';
import { fmtNumber } from '@/lib/game/utils';
import { getAllStrains, itemCost, seedCost } from '@/lib/game/engine';
import { CartPanel } from './cart/CartPanel';

type Props = { state: GameState; actions: GameActions };

const SHOP_TABS = [
  { id: 'seeds', label: '🌱 Samen' },
  { id: 'tools', label: '🛠️ Werkzeuge & Gear' },
  { id: 'consumables', label: '🧪 Verbrauch' }
];

export function ShopTab({ state, actions }: Props) {
  const [tab, setTab] = useState('seeds');
  const strains = getAllStrains(state);
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = (id: string, kind: 'seed' | 'item' | 'consumable') =>
    state.cart.filter((c) => c.id === id && c.kind === kind).reduce((sum, c) => sum + c.qty, 0);

  const addToCart = (id: string, qty: number, price: number, name: string, kind: 'seed' | 'item' | 'consumable') => {
    actions.addToCart({ id, qty, price, name, kind });
    setCartOpen(true);
  };

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
            <button className="shop-cart-button" type="button" onClick={() => setCartOpen(true)}>
              <i className="fi fi-rr-shopping-cart"></i>
              <span>Warenkorb</span>
              <span className="cart-count">{state.cart.length}</span>
            </button>
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
                        {strain.name} <span className="pill muted">{strain.rarity}</span>
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
                      <div className="shop-item-actions">
                        <button className="accent" type="button" onClick={() => actions.buySeed(strain.id)} disabled={state.cash < price}>
                          Sofort
                        </button>
                        <button className="ghost" type="button" onClick={() => addToCart(strain.id, 1, price, strain.name, 'seed')}>
                          In den Warenkorb
                        </button>
                      </div>
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
                const inCart = cartCount(item.id, 'item');
                const limitReached = !item.stack && (owned + inCart) >= 1;
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
                      <div className="shop-item-actions">
                        <button className="secondary" type="button" onClick={() => actions.buyItem(item.id)} disabled={state.cash < price || limitReached}>
                          {limitReached ? 'Bereits vorhanden' : 'Kaufen'}
                        </button>
                        <button className="ghost" type="button" onClick={() => addToCart(item.id, 1, price, item.name, 'item')} disabled={limitReached}>
                          In den Warenkorb
                        </button>
                      </div>
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
                    <div className="shop-item-actions">
                      <button className="secondary" type="button" onClick={() => actions.buyPack(pack.id)} disabled={state.cash < pack.price}>
                        Kaufen
                      </button>
                      <button className="ghost" type="button" onClick={() => addToCart(pack.id, 1, pack.price, pack.name, 'consumable')}>
                        In den Warenkorb
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {cartOpen && <CartPanel state={state} actions={actions} onClose={() => setCartOpen(false)} />}
    </section>
  );
}
