import { useI18n } from '../i18n/context';
import type { VenueNameState } from '../lib/catalog/useVenueName';

/** Небольшая кнопка рядом с названием: «По-русски» / «In English» ↔ «Оригинал», с подписью «транслитерация». */
export function VenueNameToggle({ name }: { name: VenueNameState }) {
  const { t } = useI18n();
  if (!name.translit) return null;
  return (
    <span className="venue-name-toggle">
      {name.showTranslit && (
        <span className="venue-name-toggle__label">{t.name.transliterationLabel}</span>
      )}
      <button type="button" className="link-button link-button--small" onClick={name.toggle}>
        {name.showTranslit ? t.name.original : t.name.transliterate}
      </button>
    </span>
  );
}
