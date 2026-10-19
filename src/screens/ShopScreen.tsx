import { ScreenState } from '../components/ScreenState';
import { ru } from '../i18n/ru';
import type { ScreenProps } from './types';

export function ShopScreen({ status = 'empty', onRetry }: ScreenProps) {
  return (
    <ScreenState
      status={status}
      badge={ru.state.soon}
      message={status === 'empty' ? ru.screens.shop.empty : undefined}
      onRetry={onRetry}
    />
  );
}
