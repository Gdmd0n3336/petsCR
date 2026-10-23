import { applyTelegramLaunch } from './launch';

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('applyTelegramLaunch', () => {
  it('opens the venue card from start_param venue_<id>', () => {
    applyTelegramLaunch({ inTelegram: true, startParam: 'venue_abc-123' });
    expect(window.location.hash).toBe('#/venue/abc-123');
  });

  it('ignores other start params and the browser outside Telegram', () => {
    applyTelegramLaunch({ inTelegram: true, startParam: 'promo' });
    expect(window.location.hash).toBe('');
    applyTelegramLaunch({ inTelegram: false, startParam: 'venue_abc' });
    expect(window.location.hash).toBe('');
  });

  it('picks the first-launch language from Telegram: ru or unknown → ru, otherwise en', () => {
    applyTelegramLaunch({ inTelegram: true, languageCode: 'de' });
    expect(window.localStorage.getItem('lapa.lang')).toBe('en');
    window.localStorage.clear();
    applyTelegramLaunch({ inTelegram: true });
    expect(window.localStorage.getItem('lapa.lang')).toBe('ru');
  });

  it('keeps the language the person already chose', () => {
    window.localStorage.setItem('lapa.lang', 'ru');
    applyTelegramLaunch({ inTelegram: true, languageCode: 'en' });
    expect(window.localStorage.getItem('lapa.lang')).toBe('ru');
  });

  it('does not touch the language outside Telegram', () => {
    applyTelegramLaunch({ inTelegram: false, languageCode: 'en' });
    expect(window.localStorage.getItem('lapa.lang')).toBeNull();
  });
});
