import { ScreenState } from '../components/ScreenState';
import { ru } from '../i18n/ru';

export function PetScreen() {
  return <ScreenState status="empty" badge={ru.state.soon} message={ru.screens.pet.empty} />;
}
