import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { ru } from './i18n/ru';
import { makeReview, makeVenue } from './test/catalogSample';
import { memorySource } from './test/render';

/** Уровни заголовков по порядку документа: один h1 первым, дальше без пропусков (h1 → h3 нельзя). */
function headingProblems(): string[] {
  const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) =>
    Number(h.tagName[1]),
  );
  const problems: string[] = [];
  if (levels.filter((l) => l === 1).length !== 1) problems.push(`h1 count ≠ 1: ${levels}`);
  if (levels[0] !== 1) problems.push(`first heading is not h1: ${levels}`);
  levels.forEach((level, i) => {
    const prev = levels[i - 1];
    if (prev !== undefined && level > prev + 1) problems.push(`h${prev} → h${level}`);
  });
  return problems;
}

const venues = [
  makeVenue({ id: 'v1', name_original: 'Dogtown Pet Clinic', area_ru: 'Паттайя' }),
  makeVenue({ id: 'v2', name_original: 'Bay Vet', area_ru: 'Сирача', google_reviews_count: 900 }),
];
const reviews = [makeReview({ venue_id: 'v1', text: 'Great vet', text_lang: 'en' })];

describe('heading levels (accessibility audit)', () => {
  it.each(['/', '/catalog', '/venue/v1', '/venue/missing', '/bookings', '/shop', '/pet'])(
    '%s has one h1 and no skipped levels',
    async (path) => {
      window.location.hash = `#${path}`;
      render(<App source={memorySource(venues, reviews)} />);
      await waitFor(() => expect(screen.queryByText(ru.state.loading)).toBeNull());
      expect(headingProblems()).toEqual([]);
    },
  );
});
