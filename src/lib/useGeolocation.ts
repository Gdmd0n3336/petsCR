import { useCallback, useState } from 'react';

/** Если запрос разрешения закрыли без ответа, браузер может не вызвать ни один колбэк. */
export const GEO_GIVE_UP_MS = 15_000;
import type { LatLng } from './geo';

export type GeoStatus = 'idle' | 'pending' | 'granted' | 'unavailable';

/**
 * Геолокация по запросу пользователя. Отказ, ошибка или отсутствие API (бывает в Telegram WebView)
 * — тихо «unavailable», без сообщений об ошибке: экраны просто работают без расстояний.
 */
export function useGeolocation() {
  const [state, setState] = useState<{ status: GeoStatus; position: LatLng | null }>({
    status: 'idle',
    position: null,
  });

  const request = useCallback(() => {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geo) {
      setState({ status: 'unavailable', position: null });
      return;
    }
    setState((s) => (s.status === 'granted' ? s : { status: 'pending', position: null }));
    let settled = false;
    const settle = (next: { status: GeoStatus; position: LatLng | null }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      setState(next);
    };
    const giveUp = () => settle({ status: 'unavailable', position: null });
    const timer = window.setTimeout(giveUp, GEO_GIVE_UP_MS);
    try {
      geo.getCurrentPosition(
        (p) =>
          settle({
            status: 'granted',
            position: { lat: p.coords.latitude, lng: p.coords.longitude },
          }),
        giveUp,
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
      );
    } catch {
      giveUp();
    }
  }, []);

  return { ...state, request };
}
