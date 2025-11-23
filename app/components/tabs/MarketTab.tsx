'use client';

import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { getSalePricePerGram, getStrain } from '@/lib/game/engine';
import { fmtNumber } from '@/lib/game/utils';

type Props = { state: GameState; actions: GameActions };

export function MarketTab({ state, actions }: Props) {
  const pricePerG = getSalePricePerGram(state);
  const sellMax = Math.max(0, state.grams * 0.5);
  const offers = state.offers || [];
  const apothekenOffers = state.apothekenOffers || [];
  const orders = state.orders || [];

  return (
    <section id="tab-market" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Handel</h2>
          <span className="hint">Schwarzmarkt-Verkäufe</span>
        </div>
        <div className="market">
          <div className="market-row">
            <div>Effektiver Preis: {fmtNumber(pricePerG)}/g</div>
            <div>Qualitätspool: {fmtNumber(state.qualityPool.grams || 0)} g</div>
            <div>Cash: {fmtNumber(state.cash)}</div>
            <div>Neue Anfrage in: {Math.max(0, Math.round(state.nextOfferIn || 0))}s</div>
            <div>NPC-Auftrag in: {Math.max(0, Math.round(state.nextOrderIn || 0))}s</div>
          </div>
          <div className="market-actions">
            <button className="secondary" onClick={() => actions.sell(10)} disabled={state.grams < 10}>
              10 g verkaufen
            </button>
            <button className="secondary" onClick={() => actions.sell(100)} disabled={state.grams < 100}>
              100 g verkaufen
            </button>
            <button className="accent" onClick={() => actions.sell(sellMax)} disabled={state.grams <= 0}>
              50% verkaufen
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Anfragen</h3>
          <span className="hint">Zeitlich begrenzte Kaufangebote</span>
        </div>
        <div className="offer-list">
          {offers.length === 0 && <div className="placeholder">Keine Anfragen aktiv.</div>}
          {offers.map((o: any) => (
            <div key={o.id} className="offer-card">
              <div className="offer-meta">{o.grams} g @ {fmtNumber(o.pricePerG)}/g</div>
              <div className="offer-expire">Läuft ab: {Math.max(0, Math.round((o.expiresAt - Date.now()) / 1000))}s</div>
              <button className="accent" disabled={state.grams < o.grams} onClick={() => actions.acceptOffer(o.id)}>
                Erfüllen
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Apotheken-Angebote</h3>
          <span className="hint">Höherpreisige Lieferungen</span>
        </div>
        <div className="offer-list">
          {apothekenOffers.length === 0 && <div className="placeholder">Keine Apotheken-Angebote aktiv.</div>}
          {apothekenOffers.map((o: any) => (
            <div key={o.id} className="offer-card">
              <div className="offer-meta">{o.grams} g @ {fmtNumber(o.pricePerG)}/g</div>
              <div className="offer-expire">Läuft ab: {Math.max(0, Math.round((o.expiresAt - Date.now()) / 1000))}s</div>
              <button className="accent" disabled={state.grams < o.grams} onClick={() => actions.deliverApotheke(o.id)}>
                Liefern
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>NPC-Aufträge</h3>
          <span className="hint">Bestellungen nach Sorten</span>
        </div>
        <div className="offer-list">
          {orders.length === 0 && <div className="placeholder">Keine Aufträge aktiv.</div>}
          {orders.map((o: any) => (
            <div key={o.id} className="offer-card">
              <div className="offer-meta">
                {o.grams} g · {o.strainId ? getStrain(state, o.strainId).name : 'Beliebig'} @ {fmtNumber(o.pricePerG)}/g
              </div>
              <div className="offer-expire">Läuft ab: {Math.max(0, Math.round((o.expiresAt - Date.now()) / 1000))}s</div>
              <button className="accent" disabled={state.grams < o.grams} onClick={() => actions.deliverOrder(o.id)}>
                Liefern
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
