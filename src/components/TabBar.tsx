import { ru, type TabId } from '../i18n/ru';

const TAB_ORDER: readonly TabId[] = ['nearby', 'catalog', 'bookings', 'shop', 'pet'];

type Props = { active: TabId; onChange: (tab: TabId) => void };

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tab-bar" role="tablist" aria-label={ru.tabsLabel}>
      {TAB_ORDER.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          id={`tab-${tab}`}
          aria-controls={`panel-${tab}`}
          aria-selected={tab === active}
          className="tab"
          onClick={() => onChange(tab)}
        >
          {ru.tabs[tab]}
        </button>
      ))}
    </nav>
  );
}
