// Палитры design/tokens.css: атрибут data-theme на <html>, выбор в localStorage (DESIGN.md §9).
// Тот же разбор стоит inline-скриптом в index.html, чтобы палитра не мигала при загрузке.

export type Theme = 'tishina' | 'teplo';
export const THEMES: readonly Theme[] = ['tishina', 'teplo'];
export const THEME_KEY = 'lapa.theme';
export const DEFAULT_THEME: Theme = 'tishina';

export function parseTheme(value: unknown): Theme {
  return value === 'teplo' ? 'teplo' : DEFAULT_THEME;
}

/** Хранилище может быть недоступно (приватный режим, WebView): тогда палитра по умолчанию. */
export function readStoredTheme(): Theme {
  try {
    return parseTheme(window.localStorage.getItem(THEME_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // без хранилища выбор живёт до перезагрузки
  }
}

/** Ставит data-theme и подгоняет цвет системной панели браузера под фон экрана (--ground). */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const ground = getComputedStyle(root).getPropertyValue('--ground').trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && ground) meta.setAttribute('content', ground);
}

/** Значение CSS-переменной токена для мест, где нужен цвет строкой (метки карты). */
export function tokenValue(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
