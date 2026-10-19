import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { ru } from './i18n/ru';

describe('App', () => {
  it('renders outside Telegram with the title and five tabs in order', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: ru.appName })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: ru.tabsLabel });
    const tabs = within(nav)
      .getAllByRole('button')
      .map((tab) => tab.textContent);
    expect(tabs).toEqual([
      ru.tabs.nearby,
      ru.tabs.catalog,
      ru.tabs.bookings,
      ru.tabs.shop,
      ru.tabs.pet,
    ]);
  });

  it('marks the active tab with aria-current="page" and switches the screen', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('button', { name: ru.tabs.nearby })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('main', { name: ru.tabs.nearby })).toHaveTextContent(
      ru.screens.nearby.empty,
    );

    await user.click(screen.getByRole('button', { name: ru.tabs.pet }));

    expect(screen.getByRole('button', { name: ru.tabs.pet })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: ru.tabs.nearby })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('main', { name: ru.tabs.pet })).toHaveTextContent(ru.state.soon);
  });
});
