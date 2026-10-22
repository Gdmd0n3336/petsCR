import { useState } from 'react';
import { useI18n } from '../../i18n/context';
import { venueName, venueTransliteration } from './names';
import type { Venue } from './types';

/** Название как у источника; toggle показывает транслитерацию, повторный вызов возвращает оригинал. */
export function useVenueName(
  venue: Pick<Venue, 'name_original' | 'name_th' | 'name_en' | 'name_ru'>,
) {
  const { lang } = useI18n();
  const [showTranslit, setShowTranslit] = useState(false);
  const translit = venueTransliteration(venue, lang);
  const active = showTranslit && translit !== null;
  return {
    shown: active ? translit : venueName(venue),
    translit,
    showTranslit: active,
    toggle: () => setShowTranslit((v) => !v),
  };
}

export type VenueNameState = ReturnType<typeof useVenueName>;
