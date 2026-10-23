import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { en } from '../i18n/en';
import { ru } from '../i18n/ru';
import { makeReview, makeVenue } from '../test/catalogSample';
import { memorySource, renderWithProviders } from '../test/render';
import { VenueScreen } from './VenueScreen';

const venue = makeVenue({
  id: 'v1',
  name_original: 'โรงพยาบาลสัตว์อุ้มรัก อ่างศิลา',
  name_ru: 'Ветбольница Ум Рак',
  name_en: 'Um Rak Animal Hospital',
  google_rating: 4.6,
  google_reviews_count: 707,
  collected: { reviewsCount: 81, avgRating: 4.7 },
  phone: '+66 38 142 117',
  website: 'https://example.com',
  lat: 13.33,
  lng: 100.92,
  address: '90 ถ.อ่างศิลา',
  opening_hours: [
    'วันจันทร์',
    'วันอังคาร',
    'วันพุธ',
    'วันพฤหัสบดี',
    'วันศุกร์',
    'วันเสาร์',
    'วันอาทิตย์',
  ]
    .map((d, i) => `${d}: ${i === 6 ? 'ปิดทำการ' : '9:00 to 19:00'}`)
    .join('; '),
  is_24_7: true,
});

const translated = makeReview({
  id: 'r-th',
  author_display: 'พบฝัน',
  text: 'คุณหมอใจดี',
  text_lang: 'th',
  text_ru: 'Доктор добрый',
  text_en: null,
  needs_ru: false,
  needs_en: true,
  review_date: '2026-10-03',
});
const russian = makeReview({
  id: 'r-ru',
  author_display: 'Ольга',
  text: 'Всё отлично',
  text_lang: 'ru',
  text_ru: 'Всё отлично',
  text_en: 'All great',
  needs_ru: false,
  needs_en: false,
  review_date: '2026-09-01',
});
const long = makeReview({
  id: 'r-long',
  text: 'Very long text. '.repeat(40),
  text_lang: 'en',
  text_ru: null,
  needs_ru: true,
  rating_overall: 1,
  review_date: '2026-08-01',
});
const markup = makeReview({
  id: 'r-html',
  text: '<b>bold</b><img src=x onerror=alert(1)>',
  text_lang: 'en',
  text_ru: null,
  review_date: '2026-07-01',
});

function renderVenue(
  options: { lang?: 'ru' | 'en'; reviews?: ReturnType<typeof makeReview>[] } = {},
) {
  const source = memorySource([venue], options.reviews ?? [translated, russian, long, markup]);
  renderWithProviders(<VenueScreen id="v1" onBack={vi.fn()} />, { source, lang: options.lang });
  return source;
}

const reviewOf = (text: string | RegExp) => screen.getByText(text).closest('li')!;

describe('VenueScreen', () => {
  it('shows the header, both ratings separately with their sources, and actions', async () => {
    renderVenue();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'โรงพยาบาลสัตว์อุ้มรัก อ่างศิลา' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('rating-google')).getByText('Google 4,6 · 707 отзывов'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('rating-google')).getByText(ru.venue.googleSource),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('rating-collected')).getByText(
        'Собрано отзывов: 81, средняя оценка 4,7',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('rating-collected')).getByText(ru.venue.collectedSource),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Оценка 4,6 из 5' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: ru.venue.call })).toHaveAttribute(
      'href',
      'tel:+6638142117',
    );
    const route = screen.getByRole('link', { name: ru.venue.route });
    expect(route).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=13.33%2C100.92',
    );
    expect(route).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: ru.venue.website })).toHaveAttribute(
      'href',
      'https://example.com',
    );
    expect(screen.getByRole('link', { name: ru.venue.share }).getAttribute('href')).toMatch(
      /^https:\/\/t\.me\/share\/url\?url=.*%23%2Fvenue%2Fv1/,
    );
  });

  it('shows the original name and the transliteration on request (rule 1)', async () => {
    const user = userEvent.setup();
    renderVenue({ lang: 'en' });
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'โรงพยาบาลสัตว์อุ้มรัก อ่างศิลา',
    });
    expect(heading).toHaveTextContent('โรงพยาบาลสัตว์อุ้มรัก อ่างศิลา');
    await user.click(screen.getByRole('button', { name: en.name.transliterate }));
    expect(heading).toHaveTextContent('Um Rak Animal Hospital');
    expect(screen.getByText(en.name.transliterationLabel)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: en.name.original }));
    expect(heading).toHaveTextContent('โรงพยาบาลสัตว์อุ้มรัก อ่างศิลา');
    // в «Поделиться» уходит оригинальное название
    expect(
      decodeURIComponent(screen.getByRole('link', { name: en.venue.share }).getAttribute('href')!),
    ).toContain('โรงพยาบาลสัตว์อุ้มรัก');
  });

  it('parses opening hours into weekdays', async () => {
    renderVenue();
    expect(await screen.findByText('Пн–Сб')).toBeInTheDocument();
    expect(screen.getByText('09:00–19:00')).toBeInTheDocument();
    expect(screen.getByText(ru.venue.closed)).toBeInTheDocument();
  });

  it('shows a translated review with «auto» label and toggles to the original', async () => {
    const user = userEvent.setup();
    renderVenue();
    const item = (await screen.findByText('Доктор добрый')).closest('li')!;
    expect(within(item).getByText(ru.reviews.auto)).toBeInTheDocument();
    expect(within(item).getByText('พบฝัน')).toBeInTheDocument();
    await user.click(within(item).getByRole('button', { name: ru.reviews.showOriginal }));
    expect(within(item).getByText('คุณหมอใจดี')).toBeInTheDocument();
    await user.click(within(item).getByRole('button', { name: ru.reviews.showTranslation }));
    expect(within(item).getByText('Доктор добрый')).toBeInTheDocument();
  });

  it('shows the original with «translation soon» when there is no translation', async () => {
    renderVenue({ lang: 'en' });
    const item = (await screen.findByText('คุณหมอใจดี')).closest('li')!;
    expect(within(item).getByText(en.reviews.soon)).toBeInTheDocument();
    expect(within(item).queryByRole('button', { name: en.reviews.showTranslation })).toBeNull();
  });

  it('shows a review in the interface language without labels', async () => {
    renderVenue();
    const item = (await screen.findByText('Всё отлично')).closest('li')!;
    expect(within(item).queryByText(ru.reviews.auto)).toBeNull();
    expect(within(item).queryByText(ru.reviews.soon)).toBeNull();
    expect(within(item).queryByRole('button')).toBeNull();
  });

  it('collapses long texts', async () => {
    const user = userEvent.setup();
    renderVenue();
    await screen.findByText('Доктор добрый');
    const item = reviewOf(/^Very long text/);
    expect(within(item).getByText(/…$/)).toBeInTheDocument();
    await user.click(within(item).getByRole('button', { name: ru.reviews.expand }));
    expect(within(item).getByRole('button', { name: ru.reviews.collapse })).toBeInTheDocument();
    expect(within(item).queryByText(/…$/)).toBeNull();
  });

  it('renders review text as plain text, never as markup', async () => {
    renderVenue();
    await screen.findByText('Доктор добрый');
    expect(screen.getByText('<b>bold</b><img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('.review img, .review b')).toBeNull();
  });

  it('sorts lowest first, filters by rating and loads reviews in pages of 10', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, i) =>
      makeReview({
        id: `p${i}`,
        text: `Review ${i}`,
        text_lang: 'ru',
        review_date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      }),
    );
    const source = renderVenue({ reviews: [...many, long] });
    await screen.findByText('Review 11');
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    await user.click(screen.getByRole('button', { name: ru.reviews.more }));
    expect(await screen.findByText(/^Very long text/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(13);
    expect(screen.queryByRole('button', { name: ru.reviews.more })).toBeNull();
    expect(source.loadReviews).toHaveBeenCalledWith({
      venueId: 'v1',
      sort: 'newest',
      rating: null,
      page: 1,
    });

    await user.click(screen.getByRole('button', { name: ru.reviews.lowest }));
    expect(await screen.findAllByRole('listitem')).not.toHaveLength(0);
    await vi.waitFor(() =>
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/Very long text/),
    );

    await user.selectOptions(screen.getByRole('combobox', { name: ru.reviews.ratingFilter }), '3');
    expect(await screen.findByText(ru.reviews.emptyFiltered)).toBeInTheDocument();
  });

  it('does not show reviews of another filter when the next request fails', async () => {
    const source = memorySource([venue], [translated, russian]);
    const user = userEvent.setup();
    renderWithProviders(<VenueScreen id="v1" onBack={vi.fn()} />, { source });
    await screen.findByText('Доктор добрый');
    source.loadReviews.mockRejectedValueOnce(new Error('offline'));
    await user.selectOptions(screen.getByRole('combobox', { name: ru.reviews.ratingFilter }), '1');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Доктор добрый')).toBeNull();
    expect(screen.queryByText('Всё отлично')).toBeNull();
  });

  it('opens the «soon» dialog for booking', async () => {
    const user = userEvent.setup();
    renderVenue();
    await user.click(await screen.findByRole('button', { name: ru.venue.book }));
    const dialog = screen.getByRole('dialog', { name: ru.venue.soonTitle });
    await user.click(within(dialog).getByRole('button', { name: ru.venue.close }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows «not found» for an unknown id', async () => {
    const source = memorySource([venue]);
    renderWithProviders(<VenueScreen id="missing" onBack={vi.fn()} />, { source });
    expect(await screen.findByText(ru.venue.notFound)).toBeInTheDocument();
  });

  it('shows the error state when reviews fail to load', async () => {
    const source = memorySource([venue], [translated]);
    source.loadReviews.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderWithProviders(<VenueScreen id="v1" onBack={vi.fn()} />, { source });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: ru.state.retry }));
    expect(await screen.findByText('Доктор добрый')).toBeInTheDocument();
  });
});
