import { useState } from 'react';
import { Route, Router, Switch, useLocation, useRoute } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { LangSwitch } from './components/LangSwitch';
import { TabBar } from './components/TabBar';
import { useI18n } from './i18n/context';
import { I18nProvider } from './i18n/I18nProvider';
import type { TabId } from './i18n/ru';
import { CatalogContext, useCatalogSource } from './lib/catalog/context';
import { DEFAULT_FILTERS } from './lib/catalog/filters';
import type { CatalogSource } from './lib/catalog/types';
import { useGeolocation } from './lib/useGeolocation';
import { BookingsScreen } from './screens/BookingsScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { NearbyScreen } from './screens/NearbyScreen';
import { PetScreen } from './screens/PetScreen';
import { ShopScreen } from './screens/ShopScreen';
import { VenueScreen } from './screens/VenueScreen';

const TAB_PATHS: Record<TabId, string> = {
  nearby: '/',
  catalog: '/catalog',
  bookings: '/bookings',
  shop: '/shop',
  pet: '/pet',
};

function activeTab(path: string): TabId {
  if (path.startsWith('/venue/')) return 'catalog';
  const found = (Object.keys(TAB_PATHS) as TabId[]).find((tab) => TAB_PATHS[tab] === path);
  return found ?? 'nearby';
}

function Shell() {
  const { t } = useI18n();
  const source = useCatalogSource();
  const [location, navigate] = useLocation();
  const [, venueParams] = useRoute('/venue/:id');
  // Состояние каталога и геолокации живёт выше экранов: после карточки фильтры сохраняются.
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const geo = useGeolocation();
  const tab = activeTab(location);

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t.appName}</h1>
        <LangSwitch />
      </header>
      {source.mode === 'sample' && (
        <p className="sample-banner" role="note">
          {t.sampleBanner}
        </p>
      )}
      <main className="app-main" aria-label={t.tabs[tab]}>
        <Switch>
          <Route path="/catalog">
            <CatalogScreen filters={filters} onFiltersChange={setFilters} geo={geo} />
          </Route>
          <Route path="/venue/:id">
            {venueParams && (
              <VenueScreen
                key={venueParams.id}
                id={venueParams.id}
                onBack={() =>
                  window.history.length > 1 ? window.history.back() : navigate('/catalog')
                }
              />
            )}
          </Route>
          <Route path="/bookings">
            <BookingsScreen />
          </Route>
          <Route path="/shop">
            <ShopScreen />
          </Route>
          <Route path="/pet">
            <PetScreen />
          </Route>
          <Route>
            <NearbyScreen />
          </Route>
        </Switch>
      </main>
      <TabBar active={tab} onChange={(next) => navigate(TAB_PATHS[next])} />
    </div>
  );
}

/** source — для тестов; по умолчанию база или образец данных по переменным окружения. */
export default function App({ source }: { source?: CatalogSource }) {
  return (
    <I18nProvider>
      <CatalogContext.Provider value={source ?? null}>
        <Router hook={useHashLocation}>
          <Shell />
        </Router>
      </CatalogContext.Provider>
    </I18nProvider>
  );
}
