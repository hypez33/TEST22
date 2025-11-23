'use client';

type Tab = {
  id: string;
  label: string;
  icon: string;
};

type Props = {
  tabs: Tab[];
  active: string;
  onSelect: (id: string) => void;
};

export function SidebarNav({ tabs, active, onSelect }: Props) {
  return (
    <nav className="sidebar" aria-label="Hauptmenü">
      <button className="sidebar-toggle" aria-label="Menü">
        <i className="fi fi-rr-menu-burger" />
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn nav-btn ${active === tab.id ? 'active' : ''}`}
          data-tab={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
        >
          <i className={`ico ${tab.icon}`} aria-hidden="true" />
          <span className="label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
