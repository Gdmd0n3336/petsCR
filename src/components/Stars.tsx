import { useI18n } from '../i18n/context';
import { formatRating } from '../i18n/locale';
import { Icon } from './Icon';

/** Звёзды — только украшение: смысл передают видимое число и подпись для экранных читалок. */
export function Stars({ value, showNumber = true }: { value: number; showNumber?: boolean }) {
  const { t, lang } = useI18n();
  const rounded = Math.round(value);
  const label = t.venue.ratingOutOf5(formatRating(value, lang));
  return (
    <span className="stars" role="img" aria-label={label}>
      <span className="stars__icons" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Icon
            key={i}
            name="star"
            size={16}
            filled
            className={i < rounded ? 'stars__on' : 'stars__off'}
          />
        ))}
      </span>
      {showNumber && (
        <span className="stars__number" aria-hidden="true">
          {formatRating(value, lang)}
        </span>
      )}
    </span>
  );
}
