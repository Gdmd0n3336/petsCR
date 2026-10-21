import { createContext, useContext } from 'react';
import { MESSAGES, type Lang } from './locale';
import type { Messages } from './ru';

export type I18n = { lang: Lang; t: Messages; setLang: (lang: Lang) => void };

export const I18nContext = createContext<I18n>({ lang: 'ru', t: MESSAGES.ru, setLang: () => {} });

export function useI18n(): I18n {
  return useContext(I18nContext);
}
