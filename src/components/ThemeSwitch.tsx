import type { KeyboardEvent } from 'react';
import { useI18n } from '../i18n/context';
import { useTheme } from '../theme/context';

/**
 * Переключатель палитры в шапке (DESIGN.md §4): кнопка-ползунок 66×44 без текста.
 * Нажатие (мышь, Enter, Space) переключает палитру; стрелки ←/→ выбирают Тишину/Тепло.
 */
export function ThemeSwitch() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setTheme(e.key === 'ArrowLeft' ? 'tishina' : 'teplo');
    }
  };

  return (
    <button
      type="button"
      className="theme-switch"
      data-palette={theme}
      aria-label={t.themeSwitch.label}
      aria-describedby="theme-switch-current"
      onClick={() => setTheme(theme === 'tishina' ? 'teplo' : 'tishina')}
      onKeyDown={onKeyDown}
    >
      <span className="theme-switch__track" aria-hidden="true">
        <span className="theme-switch__dot theme-switch__dot--tishina" />
        <span className="theme-switch__dot theme-switch__dot--teplo" />
        <span className="theme-switch__knob" />
      </span>
      <span id="theme-switch-current" className="visually-hidden">
        {t.themeSwitch.current(t.themeSwitch[theme])}
      </span>
    </button>
  );
}
