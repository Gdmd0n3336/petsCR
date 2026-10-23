import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ru } from '../i18n/ru';

describe('Pet screen', () => {
  it('is only the «soon» placeholder, without the old «Appearance» section', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: ru.tabs.pet }));
    expect(screen.getByText(ru.screens.pet.empty)).toBeInTheDocument();
    expect(screen.getByText(ru.state.soon)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.queryByText('Оформление')).toBeNull();
  });
});
