import { readConfig } from '../config';
import { getSupabase } from '../supabase';
import { createFixtureSource } from './fixtureSource';
import { createSupabaseSource } from './supabaseSource';
import type { CatalogSource, ReviewPage, Venue } from './types';

/** Кеш в памяти на сессию; неудачный ответ не кешируется, чтобы «Повторить» сработал. */
export function withCache(source: CatalogSource): CatalogSource {
  let venues: Promise<Venue[]> | undefined;
  const reviews = new Map<string, Promise<ReviewPage>>();

  return {
    mode: source.mode,
    loadVenues() {
      venues ??= source.loadVenues().catch((error: unknown) => {
        venues = undefined;
        throw error;
      });
      return venues;
    },
    loadReviews(query) {
      const key = JSON.stringify([query.venueId, query.sort, query.rating, query.page]);
      let page = reviews.get(key);
      if (!page) {
        page = source.loadReviews(query).catch((error: unknown) => {
          reviews.delete(key);
          throw error;
        });
        reviews.set(key, page);
      }
      return page;
    },
  };
}

let instance: CatalogSource | undefined;

/** База, если заданы переменные Supabase; иначе образец данных (отдельный чанк, грузится по требованию). */
export function getCatalogSource(): CatalogSource {
  instance ??= withCache(
    readConfig().supabase
      ? createSupabaseSource(getSupabase())
      : createFixtureSource(() =>
          import('../../../fixtures/catalog.sample.json').then((module) => module.default),
        ),
  );
  return instance;
}
