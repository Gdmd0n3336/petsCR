import type { Lang } from '../i18n/locale';
import type { Review } from './catalog/types';

export type ReviewTextView = {
  text: string;
  /** auto — показан перевод; soon — перевода ещё нет, показан оригинал; original — оригинал по кнопке. */
  label: 'auto' | 'soon' | 'original' | null;
  /** Какую кнопку показать; null — переключать не на что. */
  toggle: 'showOriginal' | 'showTranslation' | null;
};

/**
 * Правила показа 3–4. Функция только выбирает между готовыми text_ru / text_en и оригиналом:
 * своего «перевода» она не создаёт. Нет текста — null (отзыв из одной оценки).
 */
export function pickReviewText(
  review: Pick<Review, 'text' | 'text_lang' | 'text_ru' | 'text_en' | 'needs_ru' | 'needs_en'>,
  lang: Lang,
  showOriginal: boolean,
): ReviewTextView | null {
  const original = review.text?.trim() ? review.text : null;
  if (!original) return null;

  // Оригинал уже на языке интерфейса — без подписей и кнопки.
  if (review.text_lang === lang) return { text: original, label: null, toggle: null };

  const translation = lang === 'ru' ? review.text_ru : review.text_en;
  const needs = lang === 'ru' ? review.needs_ru : review.needs_en;

  if (translation?.trim() && translation !== original) {
    return showOriginal
      ? { text: original, label: 'original', toggle: 'showTranslation' }
      : { text: translation, label: 'auto', toggle: 'showOriginal' };
  }
  // Перевод совпал с оригиналом (эмодзи, цифры) или не нужен (needs = false) — показываем как есть.
  if (translation || needs === false) return { text: original, label: null, toggle: null };
  return { text: original, label: 'soon', toggle: null };
}

/** Длинный текст сворачиваем по границе слова. */
export const COLLAPSE_AT = 280;

export function shortenText(text: string, limit = COLLAPSE_AT): string | null {
  if (text.length <= limit) return null;
  const cut = text.slice(0, limit);
  const space = cut.lastIndexOf(' ');
  return `${(space > limit * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
