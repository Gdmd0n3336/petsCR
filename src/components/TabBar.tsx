import { useI18n } from '../i18n/context';
import type { TabId } from '../i18n/ru';
import { Icon } from './Icon';

const TAB_ORDER: readonly TabId[] = ['nearby', 'catalog', 'bookings', 'shop', 'pet'];

type Props = { active: TabId | null; onChange: (tab: TabId) => void };

/** Нижнее меню: значок 24 + подпись 11 (DESIGN.md §4), активная помечена aria-current="page". */
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
          <Icon name={tab} />
          <span className="tab__label">{t.tabs[tab]}</span>
        </button>
      ))}
    </nav>
  );
}
