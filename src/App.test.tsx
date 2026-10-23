import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { ru } from './i18n/ru';

describe('App', () => {
  it('renders outside Telegram with the title and five tabs in order', () => {
    render(<App />);
    // Крупный заголовок — название раздела (решение Макса, TASK-UI); «Lapa» — в заголовке вкладки браузера.
    expect(screen.getByRole('heading', { level: 1, name: ru.tabs.nearby })).toBeInTheDocument();
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
    // без геолокации (в jsdom её нет) — популярные из образца данных
    expect(
      await screen.findByRole('heading', { level: 2, name: ru.nearby.popular }),
    ).toBeInTheDocument();

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

describe('App with catalog', () => {
  it('shows the test-mode banner on sample data and opens a venue card from the catalog', async () => {
    const user = userEvent.setup();
    const { memorySource } = await import('./test/render');
    const { makeVenue } = await import('./test/catalogSample');
    render(
      <App source={memorySource([makeVenue({ id: 'v1', name_original: 'Dogtown Pet Clinic' })])} />,
    );

    expect(screen.getByRole('note')).toHaveTextContent('Тестовый режим: образец данных');
    await user.click(screen.getByRole('button', { name: ru.tabs.catalog }));
    await user.click(await screen.findByRole('link', { name: /Dogtown Pet Clinic/ }));

    expect(window.location.hash).toBe('#/venue/v1');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Dogtown Pet Clinic' }),
    ).toBeInTheDocument();
    // На карточке нижняя панель скрыта, внизу закреплена кнопка записи (DESIGN.md §4).
    expect(screen.queryByRole('navigation', { name: ru.tabsLabel })).toBeNull();
    expect(screen.getByRole('button', { name: ru.venue.book })).toBeInTheDocument();
  });

  it('switches to English and remembers the choice', async () => {
    const user = userEvent.setup();
    const { en } = await import('./i18n/en');
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.tabs.nearby);
    expect(screen.getByRole('button', { name: en.tabs.catalog })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: en.tabs.catalog })).toBeInTheDocument();
  });

  it('loads the bundled sample when Supabase is not configured', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: ru.tabs.catalog }));
    expect(await screen.findByText(ru.catalog.found(11))).toBeInTheDocument();
  });
});
