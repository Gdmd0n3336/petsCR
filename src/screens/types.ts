import type { ScreenStatus } from '../components/ScreenState';

/** Пока данных нет, экраны показывают «пусто»; загрузку и ошибку передаст будущий источник данных. */
export type ScreenProps = { status?: ScreenStatus; onRetry?: () => void };
