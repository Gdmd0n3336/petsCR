import { mockTelegramEnv } from '@telegram-apps/sdk';

const initDataRaw = new URLSearchParams({
  user: JSON.stringify({ id: 1, first_name: 'Test' }),
  auth_date: '1700000000',
  hash: 'secret-hash-value',
  signature: 'test',
}).toString();

const launchParams = new URLSearchParams({
  tgWebAppPlatform: 'tdesktop',
  tgWebAppVersion: '8.0',
  tgWebAppThemeParams: JSON.stringify({ bg_color: '#ffffff' }),
  tgWebAppData: initDataRaw,
});

async function loadTelegram() {
  vi.resetModules();
  return import('./telegram');
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.doUnmock('@telegram-apps/sdk');
});

describe('initTelegram', () => {
  it('outside Telegram returns inTelegram=false and does not throw', async () => {
    const { initTelegram } = await loadTelegram();
    expect(() => initTelegram()).not.toThrow();
    expect(initTelegram()).toEqual({ inTelegram: false });
  });

  it('inside Telegram (mocked launch params) returns inTelegram=true and does not throw', async () => {
    mockTelegramEnv({ launchParams, onEvent: () => {}, resetPostMessage: true });
    const { initTelegram } = await loadTelegram();
    expect(initTelegram()).toEqual({ inTelegram: true });
  });

  it('if the SDK throws during init, falls back to browser mode and warns without initData', async () => {
    mockTelegramEnv({ launchParams, onEvent: () => {}, resetPostMessage: true });
    const failingInit = vi.fn(() => {
      throw new Error(`sdk failure: ${initDataRaw}`);
    });
    vi.doMock('@telegram-apps/sdk', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@telegram-apps/sdk')>()),
      init: failingInit,
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { initTelegram } = await loadTelegram();

    expect(initTelegram()).toEqual({ inTelegram: false });
    expect(failingInit).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).not.toContain('secret-hash-value');
    expect(logged).not.toContain('auth_date');
  });
});

describe('launch parameters', () => {
  it('reads start_param and the Telegram language from the launch params', async () => {
    const withStart = new URLSearchParams({
      tgWebAppPlatform: 'ios',
      tgWebAppVersion: '8.0',
      tgWebAppThemeParams: JSON.stringify({ bg_color: '#ffffff' }),
      tgWebAppStartParam: 'venue_4fcfde65-cd97-44a5-ad99-951c7add4b97',
      tgWebAppData: new URLSearchParams({
        user: JSON.stringify({ id: 1, first_name: 'Test', language_code: 'th' }),
        auth_date: '1700000000',
        hash: 'h',
        signature: 's',
        start_param: 'venue_4fcfde65-cd97-44a5-ad99-951c7add4b97',
      }).toString(),
    });
    mockTelegramEnv({ launchParams: withStart, onEvent: () => {}, resetPostMessage: true });
    const { initTelegram } = await loadTelegram();
    expect(initTelegram()).toEqual({
      inTelegram: true,
      startParam: 'venue_4fcfde65-cd97-44a5-ad99-951c7add4b97',
      languageCode: 'th',
    });
  });

  it('accepts only venue_<id> start params', async () => {
    const { venueIdFromStartParam } = await loadTelegram();
    expect(venueIdFromStartParam('venue_4fcfde65-cd97-44a5-ad99-951c7add4b97')).toBe(
      '4fcfde65-cd97-44a5-ad99-951c7add4b97',
    );
    for (const bad of [undefined, '', 'venue_', 'venue_../x', 'promo_1', 'venue_a b', 'xvenue_1']) {
      expect(venueIdFromStartParam(bad)).toBeNull();
    }
  });
});

describe('openInTelegram', () => {
  it('returns false outside Telegram so the regular link opens', async () => {
    const { openInTelegram } = await loadTelegram();
    expect(openInTelegram('https://www.google.com/maps/dir/?api=1')).toBe(false);
    expect(openInTelegram('https://t.me/share/url?url=x')).toBe(false);
  });
});
