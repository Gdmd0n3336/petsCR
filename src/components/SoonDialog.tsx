import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/context';

/** Окно «Скоро» для кнопки записи (сама запись — отдельная задача). */
export function SoonDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="soon-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="soon-title">{t.venue.soonTitle}</h2>
        <p>{t.venue.soonText}</p>
        <button ref={closeRef} type="button" className="button" onClick={onClose}>
          {t.venue.close}
        </button>
      </div>
    </div>
  );
}
