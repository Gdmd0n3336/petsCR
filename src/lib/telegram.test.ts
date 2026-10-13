import { mockTelegramEnv } from '@telegram-apps/sdk';

const launchParams = new URLSearchParams({
  tgWebAppPlatform: 'tdesktop',
  tgWebAppVersion: '8.0',
  tgWebAppThemeParams: JSON.stringify({ bg_color: '#ffffff' }),
  tgWebAppData: new URLSearchParams({
    user: JSON.stringify({ id: 1, first_name: 'Test' }),
    auth_date: '1700000000',
    hash: 'test',
    signature: 'test',
  }).toString(),
});

async function loadTelegram() {
  vi.resetModules();
  return import('./telegram');
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
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

  it('if the SDK throws during init, falls back to browser mode', async () => {
    mockTelegramEnv({ launchParams, onEvent: () => {}, resetPostMessage: true });
    const failingInit = vi.fn(() => {
      throw new Error('sdk failure');
    });
    vi.doMock('@telegram-apps/sdk', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@telegram-apps/sdk')>()),
      init: failingInit,
    }));
    const { initTelegram } = await loadTelegram();
    expect(initTelegram()).toEqual({ inTelegram: false });
    expect(failingInit).toHaveBeenCalled();
    vi.doUnmock('@telegram-apps/sdk');
  });
});
