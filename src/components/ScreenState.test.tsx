import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenState } from './ScreenState';
import { ru } from '../i18n/ru';

describe('ScreenState', () => {
  it('shows loading state', () => {
    render(<ScreenState status="loading" />);
    expect(screen.getByRole('status')).toHaveTextContent(ru.state.loading);
  });

  it('shows empty state with a custom message', () => {
    render(<ScreenState status="empty" message={ru.screens.catalog.empty} />);
    expect(screen.getByText(ru.screens.catalog.empty)).toBeInTheDocument();
  });

  it('shows error state and calls onRetry', async () => {
    const onRetry = vi.fn();
    render(<ScreenState status="error" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(ru.state.error);
    await userEvent.setup().click(screen.getByRole('button', { name: ru.state.retry }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
