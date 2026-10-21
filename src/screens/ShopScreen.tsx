import { ScreenState } from '../components/ScreenState';
import { useI18n } from '../i18n/context';
import type { ScreenProps } from './types';

export function ShopScreen({ status = 'empty', onRetry }: ScreenProps) {
  const { t } = useI18n();
  return (
    <ScreenState
      status={status}
      badge={t.state.soon}
      message={status === 'empty' ? t.screens.shop.empty : undefined}
      onRetry={onRetry}
    />
  );
}
