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

/**
 * Google вызывает window.gm_authFailure при неверном ключе или запрещённом домене
 * (сама карта при этом становится серой). Подписка возвращает функцию отписки.
 */
export function onMapsAuthFailure(callback: () => void): () => void {
  const w = window as AuthWindow;
  const previous = w.gm_authFailure;
  w.gm_authFailure = () => {
    previous?.();
    callback();
  };
  return () => {
    w.gm_authFailure = previous;
  };
}
