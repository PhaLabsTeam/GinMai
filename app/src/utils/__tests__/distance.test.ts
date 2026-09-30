import { distanceMeters, formatWalk } from '../distance';

describe('distance', () => {
  it('measures a short Nimman walk', () => {
    // MAYA mall to One Nimman: roughly 700 m
    const meters = distanceMeters({ lat: 18.8025, lng: 98.9676 }, { lat: 18.8002, lng: 98.9676 + 0.006 });
    expect(meters).toBeGreaterThan(600);
    expect(meters).toBeLessThan(750);
  });

  it('is zero for the same point', () => {
    expect(distanceMeters({ lat: 18.79, lng: 98.97 }, { lat: 18.79, lng: 98.97 })).toBe(0);
  });

  it('formats walkable distances in minutes', () => {
    expect(formatWalk(0)).toBe('1 min walk');
    expect(formatWalk(480)).toBe('6 min walk');
    expect(formatWalk(2400)).toBe('30 min walk');
  });

  it('switches to kilometres past a 30-minute walk', () => {
    expect(formatWalk(3400)).toBe('3.4 km away');
  });
});
