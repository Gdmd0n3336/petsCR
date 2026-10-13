import { ScreenState } from '../components/ScreenState';
import { ru } from '../i18n/ru';

export function CatalogScreen() {
  return <ScreenState status="empty" message={ru.screens.catalog.empty} />;
}
