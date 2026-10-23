import { createContext, useContext } from 'react';
import { DEFAULT_THEME, type Theme } from './theme';

export type ThemeState = { theme: Theme; setTheme: (theme: Theme) => void };

export const ThemeContext = createContext<ThemeState>({ theme: DEFAULT_THEME, setTheme: () => {} });

export function useTheme(): ThemeState {
  return useContext(ThemeContext);
}
