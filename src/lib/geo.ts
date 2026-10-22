export type LatLng = { lat: number; lng: number };

/** Расстояние по прямой, км (формула гаверсинусов). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Центр по умолчанию — Паттайя. */
export const PATTAYA: LatLng = { lat: 12.9236, lng: 100.8825 };
