import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { en } from '../i18n/en';
import { ru } from '../i18n/ru';

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

const toggle = () => screen.getByRole('button', { name: ru.themeSwitch.label });

describe('ThemeSwitch in the header (DESIGN.md §4)', () => {
  it('sits left of RU/EN on every tab and on the venue card', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const tab of ['nearby', 'catalog', 'bookings', 'shop', 'pet'] as const) {
      await user.click(screen.getByRole('button', { name: ru.tabs[tab] }));
      const tools = toggle().parentElement!;
      expect(tools.firstElementChild).toBe(toggle());
      expect(tools.lastElementChild).toHaveAttribute('aria-label', ru.lang.label);
    }
    await user.click(screen.getByRole('button', { name: ru.tabs.catalog }));
    await user.click((await screen.findAllByRole('link', { name: /Google/ }))[0]!);
    expect(toggle()).toBeInTheDocument();
  });

  it('toggles the palette on press, describes the current one and remembers it', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    expect(document.documentElement.dataset.theme).toBe('tishina');
    expect(toggle()).toHaveAccessibleDescription('Сейчас: Тишина');

    await user.click(toggle());
    expect(document.documentElement.dataset.theme).toBe('teplo');
    expect(toggle()).toHaveAttribute('data-palette', 'teplo');
    expect(toggle()).toHaveAccessibleDescription('Сейчас: Тепло');
    expect(window.localStorage.getItem('lapa.theme')).toBe('teplo');

    unmount();
    delete document.documentElement.dataset.theme;
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('teplo');
  });

  it('works from the keyboard: Enter/Space toggle, arrows choose', async () => {
    const user = userEvent.setup();
    render(<App />);
    toggle().focus();
    await user.keyboard('{Enter}');
    expect(document.documentElement.dataset.theme).toBe('teplo');
    await user.keyboard(' ');
    expect(document.documentElement.dataset.theme).toBe('tishina');
    await user.keyboard('{ArrowRight}');
    expect(document.documentElement.dataset.theme).toBe('teplo');
    await user.keyboard('{ArrowRight}');
    expect(document.documentElement.dataset.theme).toBe('teplo');
    await user.keyboard('{ArrowLeft}');
    expect(document.documentElement.dataset.theme).toBe('tishina');
  });

  it('has an English label', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('button', { name: en.themeSwitch.label })).toBeInTheDocument();
  });
});
