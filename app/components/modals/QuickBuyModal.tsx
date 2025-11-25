'use client';

type ItemType = 'water' | 'nutrient' | 'spray';

type Props = {
  isOpen: boolean;
  itemType: ItemType;
  cost: number;
  onClose: () => void;
  onBuyAndApply: () => void;
  onGotoShop?: () => void;
};

export function QuickBuyModal({ isOpen, itemType, cost, onClose, onBuyAndApply, onGotoShop }: Props) {
  if (!isOpen) return null;
  const label = itemType === 'water' ? 'Wasser' : itemType === 'nutrient' ? 'Dünger' : 'Spray';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal quickbuy show">
        <div className="modal-header">
          <h3>⚠️ Kein {label} mehr!</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Schließen">
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>Möchtest du 1x {label} für {cost.toFixed(2)} $ kaufen und sofort anwenden?</p>
        </div>
        <div className="quickbuy-actions">
          <button className="ghost" onClick={onClose}>Abbrechen</button>
          <button className="secondary" onClick={onGotoShop}>Großpackung kaufen</button>
          <button className="accent" onClick={onBuyAndApply}>Kaufen & Anwenden</button>
        </div>
      </div>
    </div>
  );
}
