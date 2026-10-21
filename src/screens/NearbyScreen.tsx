import { ScreenState } from '../components/ScreenState';
import { useI18n } from '../i18n/context';
import type { ScreenProps } from './types';

export function NearbyScreen({ status = 'empty', onRetry }: ScreenProps) {
  const { t } = useI18n();
  return (
    <ScreenState
      status={status}
      message={status === 'empty' ? t.screens.nearby.empty : undefined}
      onRetry={onRetry}
    />
  );
}
