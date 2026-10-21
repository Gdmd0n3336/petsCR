import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext } from './context';
import { MESSAGES, initialLang, storeLang, type Lang } from './locale';

export function I18nProvider({ children, lang: fixed }: { children: ReactNode; lang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => fixed ?? initialLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      t: MESSAGES[lang],
      setLang: (next: Lang) => {
        storeLang(next);
        setLangState(next);
      },
    }),
    [lang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
