import { ScreenState } from '../components/ScreenState';
import { ru } from '../i18n/ru';
import type { ScreenProps } from './types';

export function PetScreen({ status = 'empty', onRetry }: ScreenProps) {
  return (
    <ScreenState
      status={status}
      badge={ru.state.soon}
      message={status === 'empty' ? ru.screens.pet.empty : undefined}
      onRetry={onRetry}
    />
  );
}
