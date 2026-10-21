import { useI18n } from '../i18n/context';

export type ScreenStatus = 'loading' | 'empty' | 'error';

type Props = {
  status: ScreenStatus;
  /** Текст для «пусто» и «ошибка»; по умолчанию общий текст из словаря. */
  message?: string;
  badge?: string;
  onRetry?: () => void;
};

/** Общие состояния экрана: загрузка, пусто, ошибка. */
export function ScreenState({ status, message, badge, onRetry }: Props) {
  const { t } = useI18n();
  if (status === 'loading') {
    return (
      <div className="screen-state" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>{t.state.loading}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="screen-state" role="alert">
        <p>{message ?? t.state.error}</p>
        {onRetry && (
          <button type="button" className="button" onClick={onRetry}>
            {t.state.retry}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="screen-state">
      {badge && <span className="badge">{badge}</span>}
      <p>{message ?? t.state.empty}</p>
    </div>
  );
}
