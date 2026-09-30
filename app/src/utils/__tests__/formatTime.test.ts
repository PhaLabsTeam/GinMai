import { formatTime } from '../formatTime';

describe('formatTime', () => {
  it('uses 24-hour HH:MM', () => {
    expect(formatTime(new Date(2026, 8, 30, 13, 5))).toBe('13:05');
    expect(formatTime(new Date(2026, 8, 30, 0, 0))).toBe('00:00');
  });
  it('accepts ISO strings', () => {
    expect(formatTime(new Date(2026, 8, 30, 19, 30).toISOString())).toBe('19:30');
  });
});
