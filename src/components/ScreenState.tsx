import { ru } from '../i18n/ru';

type Props =
  | { status: 'loading' }
  | { status: 'empty'; message?: string; badge?: string }
  | { status: 'error'; message?: string; onRetry?: () => void };

/** Общие состояния экрана: загрузка, пусто, ошибка. */
export function ScreenState(props: Props) {
  if (props.status === 'loading') {
    return (
      <div className="screen-state" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>{ru.state.loading}</p>
      </div>
    );
  }

  if (props.status === 'error') {
    return (
      <div className="screen-state" role="alert">
        <p>{props.message ?? ru.state.error}</p>
        {props.onRetry && (
          <button type="button" className="button" onClick={props.onRetry}>
            {ru.state.retry}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="screen-state">
      {props.badge && <span className="badge">{props.badge}</span>}
      <p>{props.message ?? ru.state.empty}</p>
    </div>
  );
}
