import { ScreenState } from '../components/ScreenState';
import { ru } from '../i18n/ru';

export function ShopScreen() {
  return <ScreenState status="empty" badge={ru.state.soon} message={ru.screens.shop.empty} />;
}
