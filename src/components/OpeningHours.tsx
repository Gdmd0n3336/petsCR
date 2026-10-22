import { useI18n } from '../i18n/context';
import { groupDays, parseOpeningHours, type DayHours } from '../lib/openingHours';

export function OpeningHours({ raw }: { raw: string }) {
  const { t } = useI18n();
  const week = parseOpeningHours(raw);
  // Формат не распознан — исходный текст как есть, чтобы ничего не потерять.
  if (!week) return <p className="raw-text">{raw}</p>;
  if (week.every((d) => d.kind === '24h')) return <p>{t.venue.allWeek24}</p>;

  const describe = (hours: DayHours) =>
    hours.kind === '24h'
      ? t.venue.open24
      : hours.kind === 'closed'
        ? t.venue.closed
        : hours.ranges.map(([from, to]) => `${from}–${to}`).join(', ');

  return (
    <dl className="hours">
      {groupDays(week).map((row) => (
        <div key={row.from} className="hours__row">
          <dt>
            {row.from === row.to
              ? t.venue.days[row.from]
              : `${t.venue.days[row.from]}–${t.venue.days[row.to]}`}
          </dt>
          <dd>{describe(row.hours)}</dd>
        </div>
      ))}
    </dl>
  );
}
