import { ScreenState } from '../components/ScreenState';
import { useI18n } from '../i18n/context';
import type { ScreenProps } from './types';

export function BookingsScreen({ status = 'empty', onRetry }: ScreenProps) {
  const { t } = useI18n();
  return (
    <ScreenState
      status={status}
      message={status === 'empty' ? t.screens.bookings.empty : undefined}
      onRetry={onRetry}
    />
  );
}
