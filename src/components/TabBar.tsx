import { useI18n } from '../i18n/context';
import type { TabId } from '../i18n/ru';

const TAB_ORDER: readonly TabId[] = ['nearby', 'catalog', 'bookings', 'shop', 'pet'];

type Props = { active: TabId | null; onChange: (tab: TabId) => void };

/** Нижнее меню: обычные кнопки, активная помечена aria-current="page". */
export function TabBar({ active, onChange }: Props) {
  const { t } = useI18n();
  return (
    <nav className="tab-bar" aria-label={t.tabsLabel}>
      {TAB_ORDER.map((tab) => (
        <button
          key={tab}
          type="button"
          className="tab"
          aria-current={tab === active ? 'page' : undefined}
          onClick={() => onChange(tab)}
        >
          {t.tabs[tab]}
        </button>
      ))}
    </nav>
  );
}
