import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import type { Lang } from '../i18n/locale';

export type MapsLibs = {
  Map: typeof google.maps.Map;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  PinElement: typeof google.maps.marker.PinElement;
};

let configured = false;

/**
 * Загрузка Maps JavaScript API (js-api-loader v2: setOptions один раз, затем importLibrary;
 * повторные importLibrary загрузчик отдаёт из своего кеша). Ключ только из переменной окружения.
 */
export async function loadGoogleMaps(apiKey: string, lang: Lang): Promise<MapsLibs> {
  if (!configured) {
    setOptions({ key: apiKey, v: 'weekly', language: lang, region: 'TH' });
    configured = true;
  }
  const [maps, marker] = await Promise.all([importLibrary('maps'), importLibrary('marker')]);
  return {
    Map: maps.Map,
    AdvancedMarkerElement: marker.AdvancedMarkerElement,
    PinElement: marker.PinElement,
  };
}

type AuthWindow = Window & { gm_authFailure?: () => void };

let authFailed = false;
const authListeners = new Set<() => void>();

/** Ключ отклонён Google в этой сессии (событие приходит один раз, при первой загрузке API). */
export function hasMapsAuthFailed(): boolean {
  return authFailed;
}

/**
 * Google вызывает window.gm_authFailure при неверном ключе или запрещённом домене
 * (сама карта при этом становится серой). Флаг запоминается на всю сессию, подписка
 * возвращает функцию отписки.
 */
export function onMapsAuthFailure(callback: () => void): () => void {
  const w = window as AuthWindow;
  if (!w.gm_authFailure) {
    w.gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((listener) => listener());
    };
  }
  authListeners.add(callback);
  return () => {
    authListeners.delete(callback);
  };
}

/** Только для тестов: сбросить запомненный сбой ключа. */
export function resetMapsAuthFailureForTests(): void {
  authFailed = false;
}
