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
      setPosition(prev => {
        const next = prev + (direction * config.speed);
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

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space' || !isActive || result) return;
    e.preventDefault();

    setIsActive(false);
    setAttempts(prev => prev + 1);

    // Perfekter Treffer (Mitte ±5%)
    if (Math.abs(position - 50) <= 5) {
      setResult('perfect');
      setTimeout(() => {
        onSuccess(config.bonus * 1.5);
        onClose();
      }, 800);
    }
    // Guter Treffer (Target-Zone)
    else if (position >= targetStart && position <= targetEnd) {
      setResult('good');
      setTimeout(() => {
        onSuccess(config.bonus);
        onClose();
      }, 800);
    }
    // Daneben
    else {
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
  }, [isActive, position, result, attempts, targetStart, targetEnd, config.bonus, onSuccess, onFail, onClose]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Schließen"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{labels.emoji}</div>
          <h2 className="text-2xl font-bold text-white mb-2">{labels.title}</h2>
          <p className="text-emerald-400 text-sm">{labels.desc}</p>
          <div className="mt-3 text-xs text-gray-400">
            Schwierigkeit: <span className="text-emerald-400 font-semibold">{difficulty}</span> | 
            Versuch: <span className="text-white font-semibold">{attempts + 1}/3</span>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative mb-6">
          {/* Track */}
          <div className="relative h-16 bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600">
            {/* Target Zone */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/20 border-x-2 border-emerald-500/50"
              style={{
                left: `${targetStart}%`,
                width: `${config.targetZone}%`
              }}
            />
            
            {/* Perfect Zone */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/30 border-x-2 border-emerald-400"
              style={{
                left: '45%',
                width: '10%'
              }}
            />

            {/* Slider */}
            <div
              className={`absolute top-0 bottom-0 w-2 transition-colors ${
                result === 'perfect' ? 'bg-yellow-400' :
                result === 'good' ? 'bg-emerald-400' :
                result === 'bad' ? 'bg-red-500' :
                'bg-white'
              } shadow-lg`}
              style={{
                left: `${position}%`,
                transform: 'translateX(-50%)',
                boxShadow: result ? 'none' : '0 0 20px rgba(255,255,255,0.8)'
              }}
            />
          </div>

          {/* Result Feedback */}
          {result && (
            <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold animate-pulse ${
              result === 'perfect' ? 'text-yellow-400' :
              result === 'good' ? 'text-emerald-400' :
              'text-red-500'
            }`}>
              {result === 'perfect' ? '⭐ PERFEKT! ⭐' :
               result === 'good' ? '✓ GUT!' :
               '✗ DANEBEN'}
            </div>
          )}
        </div>

        {/* Controls */}
        {!isActive && !result && (
          <button
            onClick={handleStart}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            START
          </button>
        )}

        {isActive && !result && (
          <div className="text-center">
            <div className="text-white font-semibold mb-2">Drücke SPACE zum richtigen Zeitpunkt!</div>
            <div className="text-sm text-gray-400">
              🎯 Perfekt = Mitte • ✓ Gut = Grüne Zone
            </div>
          </div>
        )}

        {/* Bonus Info */}
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-xs text-gray-400 text-center">
            <span className="text-yellow-400">Perfekt: +{(config.bonus * 1.5 * 100).toFixed(0)}%</span> • 
            <span className="text-emerald-400"> Gut: +{(config.bonus * 100).toFixed(0)}%</span> • 
            <span className="text-red-400"> Daneben: 0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}