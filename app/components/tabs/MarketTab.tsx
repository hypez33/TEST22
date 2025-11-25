'use client';

import { useState } from 'react';
import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';
import { getSalePricePerGram, getStrain } from '@/lib/game/engine';
import { fmtNumber } from '@/lib/game/utils';
import { useSound } from '../../hooks/useSound';

type Props = { state: GameState; actions: GameActions };

export function MarketTab({ state, actions }: Props) {
  const [buyer, setBuyer] = useState<'market' | 'street' | 'dispensary'>('market');
  const cashSound = useSound('/assets/audio/cash.mp3', state.soundFx !== false);
  const pricePerG = getSalePricePerGram(state);
  const buyerMult = buyer === 'street' ? 0.85 : buyer === 'dispensary' ? 1.15 : 1;
  const sellMax = Math.max(0, state.grams * 0.5);
  const offers = state.offers || [];
  const apothekenOffers = state.apothekenOffers || [];
  const orders = state.orders || [];
  const trend = state.marketTrend || 'stable';
  const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•';

  return (
    <section id="tab-market" className="tab">
      <div className="panel">
        <div className="panel-header market-header">
          <div>
            <h2>Handel</h2>
            <span className="hint">Schwarzmarkt-Verkäufe</span>
          </div>
          <div className="price-block">
            <div className="price-label">Aktueller Preis</div>
            <div className="price-value">
              {fmtNumber(pricePerG)} $/g
              <span className={`trend ${trend}`}>{trendIcon}</span>
            </div>
            <div className="price-sub">Buyer: {buyer === 'street' ? 'Straße' : buyer === 'dispensary' ? 'Dispensary' : 'Standard'}</div>
          </div>
        </div>
        <div className="market">
          <div className="market-grid">
            <div className="market-card">
              <div className="market-row">
                <div>Trend: {state.marketTrendName || 'Stabil'} {trendIcon}</div>
                <div>Effektiver Preis ({buyer}): {fmtNumber(pricePerG * buyerMult)}/g</div>
                <div>Qualitätspool: {fmtNumber(state.qualityPool.grams || 0)} g</div>
                <div>Cash: {fmtNumber(state.cash)}</div>
                <div>Neue Anfrage in: {Math.max(0, Math.round(state.nextOfferIn || 0))}s</div>
                <div>NPC-Auftrag in: {Math.max(0, Math.round(state.nextOrderIn || 0))}s</div>
              </div>
              <div className="market-row">
                <label>
                  Käufergruppe:{' '}
                  <select value={buyer} onChange={(e) => setBuyer(e.target.value as any)}>
                    <option value="market">Standard</option>
                    <option value="street">Straßenverkauf (schnell, -15%)</option>
                    <option value="dispensary">Dispensary (+15%)</option>
                  </select>
                </label>
              </div>
              <div className="market-actions">
                <button className="secondary" onClick={() => { actions.sellToBuyer(10, buyer); cashSound.play(); }} disabled={state.grams < 10}>
                  10 g verkaufen
                </button>
                <button className="secondary" onClick={() => { actions.sellToBuyer(100, buyer); cashSound.play(); }} disabled={state.grams < 100}>
                  100 g verkaufen
                </button>
                <button className="accent" onClick={() => { actions.sellToBuyer(sellMax, buyer); cashSound.play(); }} disabled={state.grams <= 0}>
                  50% verkaufen
                </button>
              </div>
            </div>
            <div className="market-card chart-card">
              <div className="chart-header">
                <div>Preisverlauf</div>
                <div className="chart-meta">{state.priceHistory?.length || 0} Punkte</div>
              </div>
              {state.priceHistory && state.priceHistory.length > 1 ? (
                <Sparkline data={state.priceHistory} />
              ) : (
                <div className="placeholder">Noch keine Daten</div>
              )}
              {state.marketNews && (
                <div className="market-news">
                  <span className="pill">{state.marketNews}</span>
                  {state.marketNewsTimer ? <span className="hint">{Math.round(state.marketNewsTimer)}s</span> : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Anfragen</h3>
          <span className="hint">Zeitlich begrenzte Kaufangebote</span>
        </div>
        <div className="offer-board">
          {offers.length === 0 && <div className="placeholder">Keine Anfragen aktiv.</div>}
          {offers.map((o: any) => (
            <div key={o.id} className="offer-card ticket">
              <div className="ticket-pin" />
              <div className="offer-meta">{o.grams} g @ {fmtNumber(o.pricePerG)}/g</div>
              <div className="offer-expire">Läuft ab: {Math.max(0, Math.round((o.expiresAt - Date.now()) / 1000))}s</div>
              <div className="offer-actions">
                <button className="secondary" disabled={state.grams < o.grams} onClick={() => actions.acceptOffer(o.id)}>
                  Erfüllen
                </button>
                <button className="ghost danger" onClick={() => actions.declineOffer?.(o.id)}>
                  Ablehnen
                </button>
              </div>
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
            <div key={o.id} className="offer-card ticket">
              <div className="ticket-pin" />
              <div className="offer-meta">
                {o.grams} g · {o.strainId ? getStrain(state, o.strainId).name : 'Beliebig'} @ {fmtNumber(o.pricePerG)}/g
              </div>
              <div className="offer-expire">Läuft ab: {Math.max(0, Math.round((o.expiresAt - Date.now()) / 1000))}s</div>
              <div className="offer-actions">
                <button className="accent" disabled={state.grams < o.grams} onClick={() => actions.deliverOrder(o.id)}>
                  Liefern
                </button>
                <button className="ghost danger" onClick={() => actions.declineOrder?.(o.id)}>
                  Ablehnen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sparkline">
      <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={points.join(' ')} />
    </svg>
  );
}
