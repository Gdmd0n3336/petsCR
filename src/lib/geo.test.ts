import { PATTAYA, distanceKm } from './geo';

describe('distanceKm', () => {
  it('is zero for the same point and about 27 km from Pattaya to Si Racha', () => {
    expect(distanceKm(PATTAYA, PATTAYA)).toBe(0);
    expect(distanceKm(PATTAYA, { lat: 13.1737, lng: 100.9311 })).toBeCloseTo(28.3, 0);
  });
});
