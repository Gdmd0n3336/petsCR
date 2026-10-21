import { useCallback, useState } from 'react';
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
    try {
      geo.getCurrentPosition(
        (p) =>
          setState({
            status: 'granted',
            position: { lat: p.coords.latitude, lng: p.coords.longitude },
          }),
        () => setState({ status: 'unavailable', position: null }),
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
      );
    } catch {
      setState({ status: 'unavailable', position: null });
    }
  }, []);

  return { ...state, request };
}
