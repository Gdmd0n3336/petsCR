import { ScreenState } from '../components/ScreenState';
import { ru } from '../i18n/ru';

export function NearbyScreen() {
  return <ScreenState status="empty" message={ru.screens.nearby.empty} />;
}
