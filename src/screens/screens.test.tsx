import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ru, type TabId } from '../i18n/ru';
import { BookingsScreen } from './BookingsScreen';
import { CatalogScreen } from './CatalogScreen';
import { NearbyScreen } from './NearbyScreen';
import { PetScreen } from './PetScreen';
import { ShopScreen } from './ShopScreen';
import type { ScreenProps } from './types';

const screens: [TabId, (props: ScreenProps) => React.JSX.Element][] = [
  ['nearby', NearbyScreen],
  ['catalog', CatalogScreen],
  ['bookings', BookingsScreen],
  ['shop', ShopScreen],
  ['pet', PetScreen],
];

describe.each(screens)('%s screen', (id, Screen) => {
  it('shows its empty state by default', () => {
    render(<Screen />);
    expect(screen.getByText(ru.screens[id].empty)).toBeInTheDocument();
  });

  it('shows the loading state', () => {
    render(<Screen status="loading" />);
    expect(screen.getByRole('status')).toHaveTextContent(ru.state.loading);
  });

  it('shows the error state with retry', async () => {
    const onRetry = vi.fn();
    render(<Screen status="error" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(ru.state.error);
    await userEvent.setup().click(screen.getByRole('button', { name: ru.state.retry }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
