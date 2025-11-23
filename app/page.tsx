'use client';

import { useMemo, useState } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { SidebarNav } from './components/SidebarNav';
import { FarmTab } from './components/tabs/FarmTab';
import { ShopTab } from './components/tabs/ShopTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { MarketTab } from './components/tabs/MarketTab';
import { CasesTab } from './components/tabs/CasesTab';
import { JobsTab } from './components/tabs/JobsTab';
import { InboxTab } from './components/tabs/InboxTab';
import { RealEstateTab } from './components/tabs/RealEstateTab';
import { UpgradesTab } from './components/tabs/UpgradesTab';
import { ResearchTab } from './components/tabs/ResearchTab';
import { StatsTab } from './components/tabs/StatsTab';
import { StaffTab } from './components/tabs/StaffTab';
import { BreedingTab } from './components/tabs/BreedingTab';
import { PrestigeTab } from './components/tabs/PrestigeTab';
import { useGameState } from '@/lib/game/useGameState';
import { formatGameClock } from '@/lib/game/engine';
import { RightPanel } from './components/RightPanel';
import { SettingsTab } from './components/tabs/SettingsTab';

const TABS = [
  { id: 'farm', label: 'Farm', icon: 'fi fi-sr-leaf' },
  { id: 'cases', label: 'Cases', icon: 'fi fi-sr-dice' },
  { id: 'inventory', label: 'Inventar', icon: 'fi fi-sr-box-open' },
  { id: 'trade', label: 'Growmarkt', icon: 'fi fi-sr-store-alt' },
  { id: 'market', label: 'Handel', icon: 'fi fi-sr-exchange' },
  { id: 'jobs', label: 'Jobs', icon: 'fi fi-sr-briefcase' },
  { id: 'estate', label: 'Immobilien', icon: 'fi fi-sr-buildings' },
  { id: 'upgrades', label: 'Upgrades', icon: 'fi fi-sr-bolt' },
  { id: 'research', label: 'Forschung', icon: 'fi fi-sr-flask' },
  { id: 'breeding', label: 'Kreuzung', icon: 'fi fi-sr-flask' },
  { id: 'employees', label: 'Mitarbeiter', icon: 'fi fi-sr-users' },
  { id: 'stats', label: 'Stats', icon: 'fi fi-sr-chart-line-up' },
  { id: 'prestige', label: 'Prestige', icon: 'fi fi-sr-diamond' },
  { id: 'inbox', label: 'Nachrichten', icon: 'fi fi-sr-envelope' },
  { id: 'settings', label: 'Einstellungen', icon: 'fi fi-sr-settings' }
];

export default function Page() {
  const { state, actions, derived, ready } = useGameState();
  const [activeTab, setActiveTab] = useState('farm');

  const gameClock = useMemo(() => formatGameClock(state), [state]);

  const renderTab = (id: string) => {
    switch (id) {
      case 'farm':
        return <FarmTab state={state} perSec={derived.perSec} actions={actions} />;
      case 'trade':
        return <ShopTab state={state} actions={actions} />;
      case 'inventory':
        return <InventoryTab state={state} actions={actions} />;
      case 'market':
        return <MarketTab state={state} actions={actions} />;
      case 'cases':
        return <CasesTab state={state} actions={actions} />;
      case 'jobs':
        return <JobsTab state={state} actions={actions} />;
      case 'estate':
        return <RealEstateTab state={state} actions={actions} />;
      case 'upgrades':
        return <UpgradesTab state={state} actions={actions} />;
      case 'research':
        return <ResearchTab state={state} actions={actions} />;
      case 'breeding':
        return <BreedingTab state={state} actions={actions} />;
      case 'employees':
        return <StaffTab state={state} actions={actions} />;
      case 'stats':
        return <StatsTab state={state} />;
      case 'prestige':
        return <PrestigeTab state={state} actions={actions} />;
      case 'inbox':
        return <InboxTab state={state} actions={actions} />;
      case 'settings':
        return <SettingsTab state={state} actions={actions} />;
      default:
        return <PlaceholderTab id={id} />;
    }
  };

  if (!ready) {
    return <div className="page-loading">Lade Spiel...</div>;
  }

  return (
    <div className="page-shell">
      <div className="ambient-orbs" aria-hidden="true">
        <span className="orb"></span>
        <span className="orb"></span>
        <span className="orb"></span>
      </div>
      <HeaderHUD state={state} perSec={derived.perSec} onSpeedChange={actions.setSpeed} gameClock={gameClock} />
      <SidebarNav tabs={TABS} active={activeTab} onSelect={setActiveTab} />

      <main>
        {renderTab(activeTab)}
      </main>

      <RightPanel state={state} actions={actions} />
    </div>
  );
}

function PlaceholderTab({ id }: { id: string }) {
  return (
    <section className="tab">
      <div className="panel">
        <div className="panel-header">
          <h2>{id}</h2>
          <span className="hint">Dieses System ist noch nicht vollständig migriert.</span>
        </div>
        <div className="placeholder">Tab ist verdrahtet und einsatzbereit, Logik wird noch ergänzt.</div>
      </div>
    </section>
  );
}
