import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './context';
import { applyTheme, readStoredTheme, storeTheme, type Theme } from './theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  // До отрисовки кадра, чтобы смена палитры не мигала.
  useLayoutEffect(() => applyTheme(theme), [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next: Theme) => {
        storeTheme(next);
        setThemeState(next);
      },
    }),
    [theme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
