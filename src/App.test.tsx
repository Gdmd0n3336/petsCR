import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { ru } from './i18n/ru';

describe('App', () => {
  it('renders outside Telegram with the title and five tabs in order', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: ru.appName })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual([
      ru.tabs.nearby,
      ru.tabs.catalog,
      ru.tabs.bookings,
      ru.tabs.shop,
      ru.tabs.pet,
    ]);
  });

  it('switches the visible screen when a tab is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('tab', { name: ru.tabs.nearby })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel', { name: ru.tabs.nearby })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: ru.tabs.pet }));

    expect(screen.getByRole('tab', { name: ru.tabs.pet })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: ru.tabs.nearby })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByRole('tabpanel', { name: ru.tabs.pet })).toHaveTextContent(ru.state.soon);
  });
});
