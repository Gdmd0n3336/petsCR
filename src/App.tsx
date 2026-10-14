import { useState } from 'react';
import { TabBar } from './components/TabBar';
import { ru, type TabId } from './i18n/ru';
import type { ScreenProps } from './screens/types';
import { BookingsScreen } from './screens/BookingsScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { NearbyScreen } from './screens/NearbyScreen';
import { PetScreen } from './screens/PetScreen';
import { ShopScreen } from './screens/ShopScreen';

const SCREENS: Record<TabId, (props: ScreenProps) => React.JSX.Element> = {
  nearby: NearbyScreen,
  catalog: CatalogScreen,
  bookings: BookingsScreen,
  shop: ShopScreen,
  pet: PetScreen,
};

export default function App() {
  const [tab, setTab] = useState<TabId>('nearby');
  const Screen = SCREENS[tab];

  return (
    <div className="app">
      <header className="app-header">
        <h1>{ru.appName}</h1>
      </header>
      <main className="app-main" aria-label={ru.tabs[tab]}>
        <Screen />
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
