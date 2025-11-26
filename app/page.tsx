'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'register';

const features = [
  { title: 'Idle Growing', desc: 'Baue deine Farm aus, auch wenn du offline bist, und sammle Grams & Cash.' },
  { title: 'Trading & Markt', desc: 'Dynamische Preise, Aufträge und Verhandlungen mit Händlern.' },
  { title: 'Upgrades & Forschung', desc: 'Schalte neue Räume, Genetik und Perks frei, um effizienter zu werden.' },
  { title: 'Prestige & Events', desc: 'Starte neu mit Haze Points und nutze Events, um schneller zu skalieren.' }
];

export default function LandingPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  const heroStats = useMemo(
    () => [
      { label: 'Server-Save', value: 'Tenant-sicher' },
      { label: 'Plattform', value: 'Next.js + Prisma' },
      { label: 'Status', value: 'Beta' }
    ],
    []
  );

  return (
    <div className="landing-shell">
      <div className="ambient-orbs" aria-hidden="true">
        <span className="orb"></span>
        <span className="orb"></span>
        <span className="orb"></span>
      </div>

      <header className="landing-nav">
        <div className="brand">
          <span className="logo-dot" />
          <div>
            <div className="brand-title">BudLife</div>
            <div className="brand-sub">Cannabis Idle Tycoon</div>
          </div>
        </div>
        <div className="nav-actions">
          <button className="ghost-btn" onClick={() => setAuthMode('login')}>
            Login
          </button>
          <button className="accent-btn" onClick={() => setAuthMode('register')}>
            Neues Konto
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero">
          <div>
            <p className="eyebrow">Willkommen bei BudLife</p>
            <h1>Baue, trade & prestige – dein Grow-Imperium wartet.</h1>
            <p className="lede">
              Modernes Idle-Gameplay mit persistentem Server-Save, Marktdynamik und Research-Progression. Komplett im
              Browser, ohne Install.
            </p>
            <div className="cta-row">
              <button className="accent-btn" onClick={() => setAuthMode('register')}>
                Neues Konto erstellen
              </button>
              <button className="ghost-btn" onClick={() => setAuthMode('login')}>
                Login
              </button>
            </div>
            <div className="hero-stats">
              {heroStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-card">
            <div className="glow"></div>
            <div className="hero-card-body">
              <div className="hero-card-title">Live Farm</div>
              <p className="hero-card-desc">
                Tracke Cashflow, Aufträge und Anbau in Echtzeit. Servergespeicherte Spielstände sorgen dafür, dass du
                jederzeit weiter zocken kannst.
              </p>
              <ul className="hero-list">
                <li>Persistente Saves pro Tenant</li>
                <li>Research & Prestige Progress</li>
                <li>Markt- und Auftrags-Events</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="features">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <div>
              <p className="eyebrow">Direkter Zugang</p>
              <h2>Schnell einloggen oder neues Konto anlegen</h2>
              <p className="lede">Keine E-Mail nötig. Tenant-basierte Saves werden automatisch geladen.</p>
            </div>
            <div className="cta-row">
              <button className="accent-btn" onClick={() => setAuthMode('register')}>
                Neues Konto
              </button>
              <button className="ghost-btn" onClick={() => setAuthMode('login')}>
                Login
              </button>
            </div>
          </div>
          <div className="auth-panel-grid">
            <AuthCard
              title="Login"
              description="Mit bestehendem Konto anmelden."
              mode="login"
              onSuccess={() => {
                router.push('/game');
                router.refresh();
              }}
            />
            <AuthCard
              title="Neues Konto"
              description="Tenant anlegen, User erstellen & Spielstand starten."
              mode="register"
              onSuccess={() => {
                router.push('/game');
                router.refresh();
              }}
            />
          </div>
        </section>
      </main>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={() => {
            setAuthMode(null);
            router.push('/game');
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AuthModal({
  mode,
  onClose,
  onSuccess
}: {
  mode: AuthMode;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const title = mode === 'login' ? 'Login' : 'Neues Konto erstellen';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setStatusCode(null);
    try {
      const res = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      setStatusCode(res.status);
      if (!res.ok) {
        const data = await res.json().catch(async () => {
          const text = await res.text();
          return { error: text || res.statusText };
        });
        setError(data?.error ?? 'Etwas ist schiefgelaufen.');
      } else {
        setSuccess('Erfolg! Weiterleitung...');
        onSuccess();
      }
    } catch (err) {
      setError('Netzwerkfehler. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="budmaster"
              autoFocus
              required
            />
          </label>
          <label>
            <span>Passwort</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              required
            />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          {success ? <div className="form-success">{success}</div> : null}
          {statusCode ? <div className="form-hint">HTTP {statusCode}</div> : null}
          <button className="accent-btn full" type="submit" disabled={loading}>
            {loading ? 'Bitte warten...' : title}
          </button>
        </form>
        <p className="modal-footnote">
          Keine E-Mail nötig. Dein Spielstand wird tenant-isoliert gespeichert.
        </p>
      </div>
    </div>
  );
}

function AuthCard({
  title,
  description,
  mode,
  onSuccess
}: {
  title: string;
  description: string;
  mode: AuthMode;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusCode(null);
    try {
      const res = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      setStatusCode(res.status);
      if (!res.ok) {
        const data = await res.json().catch(async () => {
          const text = await res.text();
          return { error: text || res.statusText };
        });
        setError(data?.error ?? 'Etwas ist schiefgelaufen.');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('Netzwerkfehler. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="feature-title">{title}</div>
      <p className="feature-desc">{description}</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="budmaster" />
        </label>
        <label>
          <span>Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="******"
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        {statusCode ? <div className="form-hint">HTTP {statusCode}</div> : null}
        <button className="accent-btn full" type="submit" disabled={loading}>
          {loading ? 'Bitte warten...' : title}
        </button>
      </form>
    </div>
  );
}
