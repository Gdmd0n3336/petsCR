import { ScreenState } from '../components/ScreenState';
import { ru } from '../i18n/ru';
import type { ScreenProps } from './types';

export function CatalogScreen({ status = 'empty', onRetry }: ScreenProps) {
  return (
    <ScreenState
      status={status}
      message={status === 'empty' ? ru.screens.catalog.empty : undefined}
      onRetry={onRetry}
    />
  );
}
