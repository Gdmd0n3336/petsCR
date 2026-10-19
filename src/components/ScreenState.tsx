import { ru } from '../i18n/ru';

export type ScreenStatus = 'loading' | 'empty' | 'error';

type Props = {
  status: ScreenStatus;
  /** Текст для «пусто» и «ошибка»; по умолчанию общий текст из ru.ts. */
  message?: string;
  badge?: string;
  onRetry?: () => void;
};

/** Общие состояния экрана: загрузка, пусто, ошибка. */
export function ScreenState({ status, message, badge, onRetry }: Props) {
  if (status === 'loading') {
    return (
      <div className="screen-state" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>{ru.state.loading}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="screen-state" role="alert">
        <p>{message ?? ru.state.error}</p>
        {onRetry && (
          <button type="button" className="button" onClick={onRetry}>
            {ru.state.retry}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="screen-state">
      {badge && <span className="badge">{badge}</span>}
      <p>{message ?? ru.state.empty}</p>
    </div>
  );
}
