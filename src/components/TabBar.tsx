import { ru, type TabId } from '../i18n/ru';

const TAB_ORDER: readonly TabId[] = ['nearby', 'catalog', 'bookings', 'shop', 'pet'];

type Props = { active: TabId; onChange: (tab: TabId) => void };

/** Нижнее меню: обычные кнопки, активная помечена aria-current="page". */
export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tab-bar" aria-label={ru.tabsLabel}>
      {TAB_ORDER.map((tab) => (
        <button
          key={tab}
          type="button"
          className="tab"
          aria-current={tab === active ? 'page' : undefined}
          onClick={() => onChange(tab)}
        >
          {ru.tabs[tab]}
        </button>
      ))}
    </nav>
  );
}
