import { ScreenState } from '../components/ScreenState';
import { ru } from '../i18n/ru';

export function BookingsScreen() {
  return <ScreenState status="empty" message={ru.screens.bookings.empty} />;
}
