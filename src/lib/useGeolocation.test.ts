import { act, renderHook } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

function stubGeolocation(impl: Partial<Geolocation> | undefined) {
  Object.defineProperty(navigator, 'geolocation', { value: impl, configurable: true });
}

afterEach(() => stubGeolocation(undefined));

describe('useGeolocation', () => {
  it('returns the position when allowed', () => {
    stubGeolocation({
      getCurrentPosition: (ok) =>
        ok({ coords: { latitude: 12.9, longitude: 100.9 } } as GeolocationPosition),
    });
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());
    expect(result.current.status).toBe('granted');
    expect(result.current.position).toEqual({ lat: 12.9, lng: 100.9 });
  });

  it('goes quietly unavailable on refusal, error, exception or a missing API', () => {
    stubGeolocation({
      getCurrentPosition: (_ok, fail) => fail?.({ code: 1 } as GeolocationPositionError),
    });
    const denied = renderHook(() => useGeolocation());
    act(() => denied.result.current.request());
    expect(denied.result.current.status).toBe('unavailable');

    stubGeolocation({
      getCurrentPosition: () => {
        throw new Error('blocked by WebView');
      },
    });
    const thrown = renderHook(() => useGeolocation());
    act(() => thrown.result.current.request());
    expect(thrown.result.current.status).toBe('unavailable');

    stubGeolocation(undefined);
    const missing = renderHook(() => useGeolocation());
    act(() => missing.result.current.request());
    expect(missing.result.current).toMatchObject({ status: 'unavailable', position: null });
  });
});
