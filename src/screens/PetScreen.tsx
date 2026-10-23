import { ScreenState } from '../components/ScreenState';
import { useI18n } from '../i18n/context';
import type { ScreenProps } from './types';

/** «Питомец»: профиль пока «скоро». Палитра переключается в шапке (DESIGN.md §4). */
export function PetScreen({ status = 'empty', onRetry }: ScreenProps) {
  const { t } = useI18n();
  return (
    <ScreenState
      status={status}
      badge={t.state.soon}
      message={status === 'empty' ? t.screens.pet.empty : undefined}
      onRetry={onRetry}
    />
  );
}
