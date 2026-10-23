import { makeReview } from '../test/catalogSample';
import { pickReviewText, shortenText } from './reviewText';

const thai = makeReview({
  text: 'คุณหมอใจดี',
  text_lang: 'th',
  text_ru: 'Доктор добрый',
  text_en: null,
  needs_ru: false,
  needs_en: true,
});

describe('pickReviewText (rules 3–4)', () => {
  it('shows the translation with «auto» label and a «show original» toggle', () => {
    expect(pickReviewText(thai, 'ru', false)).toEqual({
      text: 'Доктор добрый',
      label: 'auto',
      toggle: 'showOriginal',
    });
  });

  it('switches to the original and back', () => {
    expect(pickReviewText(thai, 'ru', true)).toEqual({
      text: 'คุณหมอใจดี',
      label: 'original',
      toggle: 'showTranslation',
    });
  });

  it('shows the original with «translation soon» when there is no translation', () => {
    expect(pickReviewText(thai, 'en', false)).toEqual({
      text: 'คุณหมอใจดี',
      label: 'soon',
      toggle: null,
    });
  });

  it('never invents a translation', () => {
    const view = pickReviewText(thai, 'en', false);
    expect(view?.text).toBe(thai.text);
  });

  it('shows a review written in the interface language without labels or toggle', () => {
    const russian = makeReview({
      text: 'Хорошо',
      text_lang: 'ru',
      text_ru: 'Хорошо',
      needs_ru: false,
    });
    expect(pickReviewText(russian, 'ru', false)).toEqual({
      text: 'Хорошо',
      label: null,
      toggle: null,
    });
    const english = makeReview({ text: 'Great', text_lang: 'en', text_en: null });
    expect(pickReviewText(english, 'en', false)).toEqual({
      text: 'Great',
      label: null,
      toggle: null,
    });
  });

  it('shows texts copied as-is (emoji, digits) without labels', () => {
    const emoji = makeReview({ text: '👍👍', text_lang: 'th', text_ru: '👍👍', needs_ru: false });
    expect(pickReviewText(emoji, 'ru', false)).toEqual({ text: '👍👍', label: null, toggle: null });
  });

  it('shows texts without letters (emoji, digits, signs) without «translation soon»', () => {
    for (const text of ['👍👍', '10/10 !!!', '❤️ 5+', '🐶🐱 :)']) {
      const review = makeReview({ text, text_lang: 'th', text_ru: null, needs_ru: true });
      expect(pickReviewText(review, 'ru', false)).toEqual({ text, label: null, toggle: null });
    }
  });

  it('keeps «translation soon» when the original has letters of any script', () => {
    for (const text of ['ดีมาก 👍', 'Good!', '很好', 'ok 10/10']) {
      const review = makeReview({ text, text_lang: 'th', text_ru: null, needs_ru: true });
      expect(pickReviewText(review, 'ru', false)?.label).toBe('soon');
    }
  });

  it('returns null for rating-only reviews', () => {
    expect(pickReviewText(makeReview({ text: null }), 'ru', false)).toBeNull();
    expect(pickReviewText(makeReview({ text: '  ' }), 'ru', false)).toBeNull();
  });
});

describe('shortenText', () => {
  it('keeps short texts and cuts long ones on a word boundary', () => {
    expect(shortenText('short')).toBeNull();
    const long = 'word '.repeat(100);
    const short = shortenText(long);
    expect(short?.endsWith('word…')).toBe(true);
    expect(short!.length).toBeLessThanOrEqual(281);
  });
});
