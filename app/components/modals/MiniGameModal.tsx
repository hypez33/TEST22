import { useEffect, useState, useCallback } from 'react';

type MiniGameType = 'water' | 'harvest' | 'feed' | 'treat';

interface MiniGameModalProps {
  isOpen: boolean;
  type: MiniGameType;
  difficulty?: 'easy' | 'normal' | 'hard';
  onSuccess: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
}

const GAME_CONFIG = {
  easy: { targetZone: 80, speed: 1.5, bonus: 1.0 },
  normal: { targetZone: 60, speed: 2.5, bonus: 1.2 },
  hard: { targetZone: 40, speed: 3.5, bonus: 1.5 }
};

const GAME_LABELS = {
  water: { title: '💧 Bewässerung', desc: 'Drücke Space zum perfekten Zeitpunkt!', emoji: '💧' },
  harvest: { title: '✂️ Ernte', desc: 'Schneide zur richtigen Zeit!', emoji: '✂️' },
  feed: { title: '🌱 Düngung', desc: 'Dosiere perfekt!', emoji: '🌱' },
  treat: { title: '🛡️ Behandlung', desc: 'Timing ist alles!', emoji: '🛡️' }
};

export default function MiniGameModal({
  isOpen,
  type,
  difficulty = 'normal',
  onSuccess,
  onFail,
  onClose
}: MiniGameModalProps) {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<'perfect' | 'good' | 'bad' | null>(null);
  const [attempts, setAttempts] = useState(0);

  const config = GAME_CONFIG[difficulty];
  const labels = GAME_LABELS[type];
  const targetStart = 50 - config.targetZone / 2;
  const targetEnd = 50 + config.targetZone / 2;

  useEffect(() => {
    if (!isOpen || !isActive) return;

    const interval = setInterval(() => {
      setPosition((prev) => {
        const next = prev + direction * config.speed;
        if (next >= 100) {
          setDirection(-1);
          return 100;
        }
        if (next <= 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isOpen, isActive, direction, config.speed]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !isActive || result) return;
      e.preventDefault();

      setIsActive(false);
      setAttempts((prev) => prev + 1);

      if (Math.abs(position - 50) <= 5) {
        setResult('perfect');
        setTimeout(() => {
          onSuccess(config.bonus * 1.5);
          onClose();
        }, 800);
      } else if (position >= targetStart && position <= targetEnd) {
        setResult('good');
        setTimeout(() => {
          onSuccess(config.bonus);
          onClose();
        }, 800);
      } else {
        setResult('bad');
        setTimeout(() => {
          if (attempts >= 2) {
            onFail();
            onClose();
          } else {
            setResult(null);
            setPosition(0);
            setDirection(1);
            setIsActive(true);
          }
        }, 800);
      }
    },
    [isActive, position, result, attempts, targetStart, targetEnd, config.bonus, onSuccess, onFail, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, handleKeyPress]);

  const handleStart = () => {
    setIsActive(true);
    setResult(null);
    setAttempts(0);
    setPosition(0);
    setDirection(1);
  };

  if (!isOpen) return null;

  return (
    <div className="mini-game-backdrop">
      <div className="mini-game-card">
        <button className="mini-game-close" onClick={onClose} aria-label="Schließen">
          ×
        </button>
        <div className="mini-game-header">
          <div className="mini-game-emoji">{labels.emoji}</div>
          <h2>{labels.title}</h2>
          <p>{labels.desc}</p>
          <div className="mini-game-meta">
            Schwierigkeit: <strong>{difficulty}</strong> · Versuch {attempts + 1}/3
          </div>
        </div>

        <div className="mini-game-track">
          <div className="mini-game-target" style={{ left: `${targetStart}%`, width: `${config.targetZone}%` }} />
          <div className="mini-game-perfect" />
          <div
            className={`mini-game-slider ${result || ''}`}
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
          />
          {result && (
            <div className={`mini-game-result ${result}`}>
              {result === 'perfect' ? '⭐ PERFEKT! ⭐' : result === 'good' ? '✓ GUT!' : '✗ DANEBEN'}
            </div>
          )}
        </div>

        {!isActive && !result && (
          <button className="mini-game-start" onClick={handleStart}>
            START
          </button>
        )}
        {isActive && !result && (
          <div className="mini-game-instructions">
            <div>Drücke SPACE zum richtigen Zeitpunkt!</div>
            <div className="hint">🎯 Perfekt = Mitte · ✓ Gut = Grüne Zone</div>
          </div>
        )}

        <div className="mini-game-bonus">
          <span className="perfect">Perfekt: +{(config.bonus * 1.5 * 100).toFixed(0)}%</span> ·
          <span className="good"> Gut: +{(config.bonus * 100).toFixed(0)}%</span> ·
          <span className="bad"> Daneben: 0%</span>
        </div>
      </div>
    </div>
  );
}
