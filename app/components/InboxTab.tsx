import { GameState } from '@/lib/game/types';
import { GameActions } from '@/lib/game/useGameState';

type Props = {
  state: GameState;
  actions: GameActions;
};

export function InboxTab({ state, actions }: Props) {
  return (
    <section id="tab-inbox" className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>Nachrichten</h2>
          <span className="hint">Bewerbungen, Events und Systemmeldungen</span>
        </div>
        <div className="message-list">
          {state.messages.length === 0 && <div className="placeholder">Keine Nachrichten.</div>}
          {state.messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.unread ? 'unread' : ''}`}>
              <div className="message-title">{msg.type || 'Info'}</div>
              <div className="message-body">{msg.text}</div>
            </div>
          ))}
        </div>
        {state.messages.length > 0 && (
          <button className="secondary" type="button" onClick={actions.markMessagesRead}>
            Als gelesen markieren
          </button>
        )}
      </div>
    </section>
  );
}
