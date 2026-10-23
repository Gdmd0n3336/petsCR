import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ru } from '../i18n/ru';

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('Pet → Appearance', () => {
  it('defaults to Tishina, switches to Teplo, remembers it after a restart', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: ru.tabs.pet }));

    const tishina = screen.getByRole('button', { name: ru.screens.appearance.tishina });
    const teplo = screen.getByRole('button', { name: ru.screens.appearance.teplo });
    expect(
      screen.getByRole('heading', { level: 2, name: ru.screens.appearance.title }),
    ).toBeInTheDocument();
    expect(tishina).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.theme).toBe('tishina');

    await user.click(teplo);
    expect(teplo).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.theme).toBe('teplo');
    expect(window.localStorage.getItem('lapa.theme')).toBe('teplo');

    unmount();
    delete document.documentElement.dataset.theme;
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('teplo');
  });

  it('keeps the profile placeholder marked «soon»', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: ru.tabs.pet }));
    expect(screen.getByText(ru.screens.pet.empty)).toBeInTheDocument();
    expect(screen.getByText(ru.state.soon)).toBeInTheDocument();
  });
});
