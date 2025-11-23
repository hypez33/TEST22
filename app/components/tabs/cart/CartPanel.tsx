'use client';

import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { fmtNumber } from '@/lib/game/utils';

type Props = {
  state: GameState;
  actions: GameActions;
  onClose: () => void;
};

export function CartPanel({ state, actions, onClose }: Props) {
  const total = state.cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);
  return (
    <div className="modal show" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
      <div className="modal-card cart-modal-card">
        <button className="ghost cart-close" type="button" aria-label="Schließen" onClick={onClose}>
          <i className="fi fi-rr-cross-small"></i>
        </button>
        <div className="cart-panel">
          <div className="cart-header">
            <h3 id="cartTitle">Warenkorb</h3>
            <span className="hint">Sammle Produkte und kaufe gesammelt</span>
          </div>
          <div className={`cart-list ${state.cart.length === 0 ? 'empty' : ''}`}>
            {state.cart.length === 0 && <div className="cart-empty">Warenkorb leer</div>}
            {state.cart.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="cart-row">
                <div>
                  <div className="cart-name">{item.name}</div>
                  <div className="cart-meta">x{item.qty}</div>
                </div>
                <div className="cart-price">
                  <span className="coin-text">
                    <img src="/assets/coin.png" alt="" className="coin-icon" /> {fmtNumber((item.price || 0) * item.qty)}
                  </span>
                  <button className="ghost" type="button" onClick={() => actions.removeCartEntry(item.id, item.kind)}>
                    Entfernen
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <div className="cart-total">
              <span>Gesamt:</span>
              <span>
                <span className="coin-text">
                  <img src="/assets/coin.png" alt="" className="coin-icon" /> {fmtNumber(total)}
                </span>
              </span>
            </div>
            <div className="cart-actions">
              <button className="ghost" type="button" disabled={state.cart.length === 0} onClick={actions.clearCart}>
                Leeren
              </button>
              <button className="accent" type="button" disabled={state.cart.length === 0 || state.cash < total} onClick={actions.checkout}>
                Jetzt kaufen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
