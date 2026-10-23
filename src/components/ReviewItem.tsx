import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { formatDate, formatNumber } from '../i18n/locale';
import type { Review } from '../lib/catalog/types';
import { pickReviewText, shortenText } from '../lib/reviewText';
import { Stars } from './Stars';

/** Отзыв: текст только как текст (React экранирует), автор как есть, без ссылок на профиль. */
export function ReviewItem({ review }: { review: Review }) {
  const { t, lang } = useI18n();
  const [showOriginal, setShowOriginal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const view = pickReviewText(review, lang, showOriginal);
  const short = view && !expanded ? shortenText(view.text) : null;

  return (
    <li className="review">
      <div className="review__head">
        <span className="review__author">{review.author_display ?? t.reviews.anonymous}</span>
        {review.review_date && (
          <time className="review__date" dateTime={review.review_date}>
            {formatDate(review.review_date, lang)}
          </time>
        )}
      </div>
      <div className="review__rating">
        <Stars value={review.rating_overall} />
        {review.is_demo && <span className="badge badge--muted">{t.demoBadge}</span>}
      </div>
      {view && (
        <>
          <p
            className="review__text"
            lang={view.label === 'auto' ? lang : (review.text_lang ?? undefined)}
          >
            {short ?? view.text}
          </p>
          {(short || expanded) && (
            <button type="button" className="link-button" onClick={() => setExpanded(!expanded)}>
              {expanded ? t.reviews.collapse : t.reviews.expand}
            </button>
          )}
          <div className="review__translation">
            {view.label && (
              <span className="review__label">
                {t.reviews[view.label === 'original' ? 'original' : view.label]}
              </span>
            )}
            {view.toggle && (
              <button
                type="button"
                className="link-button link-button--small"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {t.reviews[view.toggle]}
              </button>
            )}
          </div>
        </>
      )}
      {review.price_paid !== null && (
        <p className="review__price">
          {t.reviews.price(`${formatNumber(review.price_paid, lang)} ฿`)}
        </p>
      )}
    </li>
  );
}
