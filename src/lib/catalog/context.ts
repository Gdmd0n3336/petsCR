import { createContext, useContext, useEffect, useState } from 'react';
import { getCatalogSource } from './source';
import type { CatalogSource, Review, ReviewQuery, Venue } from './types';

/** null — источник по умолчанию (база или образец); тесты подставляют свой. */
export const CatalogContext = createContext<CatalogSource | null>(null);

export function useCatalogSource(): CatalogSource {
  return useContext(CatalogContext) ?? getCatalogSource();
}

export type LoadStatus = 'loading' | 'ready' | 'error';

/** Все заведения одним запросом (кеш на сессию в источнике). */
export function useVenues(): { status: LoadStatus; venues: Venue[]; retry: () => void } {
  const source = useCatalogSource();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; venues: Venue[] | null } | null>(null);

  useEffect(() => {
    let alive = true;
    source.loadVenues().then(
      (venues) => alive && setResult({ attempt, venues }),
      () => alive && setResult({ attempt, venues: null }),
    );
    return () => {
      alive = false;
    };
  }, [source, attempt]);

  // Пока ответ на текущую попытку не пришёл — загрузка (без setState внутри эффекта).
  const current = result?.attempt === attempt ? result : null;
  return {
    status: !current ? 'loading' : current.venues ? 'ready' : 'error',
    venues: current?.venues ?? [],
    retry: () => setAttempt((n) => n + 1),
  };
}

type ReviewsKey = Omit<ReviewQuery, 'page'>;

/** Отзывы заведения страницами по 10: «Показать ещё» догружает следующую. */
export function useReviews({ venueId, sort, rating }: ReviewsKey) {
  const source = useCatalogSource();
  const key = `${venueId}|${sort}|${rating ?? ''}`;
  const [pages, setPages] = useState<{ key: string; count: number }>({ key, count: 1 });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    id: string;
    items: Review[];
    hasMore: boolean;
    failed: boolean;
  } | null>(null);

  const count = pages.key === key ? pages.count : 1;
  const id = `${key}|${count}|${attempt}`;

  useEffect(() => {
    let alive = true;
    Promise.all(
      Array.from({ length: count }, (_, page) =>
        source.loadReviews({ venueId, sort, rating, page }),
      ),
    ).then(
      (loaded) =>
        alive &&
        setResult({
          id,
          items: loaded.flatMap((p) => p.items),
          hasMore: loaded.at(-1)?.hasMore ?? false,
          failed: false,
        }),
      () =>
        alive &&
        setResult((prev) => ({ id, items: prev?.items ?? [], hasMore: false, failed: true })),
    );
    return () => {
      alive = false;
    };
  }, [source, venueId, sort, rating, count, id]);

  const current = result?.id === id ? result : null;
  // При догрузке уже показанные отзывы остаются на экране.
  const shown = current ?? (result && result.id.startsWith(`${key}|`) ? result : null);
  return {
    status: (current ? (current.failed ? 'error' : 'ready') : 'loading') as LoadStatus,
    items: shown?.items ?? [],
    hasMore: current?.hasMore ?? false,
    loadMore: () => setPages({ key, count: count + 1 }),
    retry: () => setAttempt((n) => n + 1),
  };
}
