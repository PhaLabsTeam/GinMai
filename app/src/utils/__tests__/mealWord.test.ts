import { mealWord, capitalize } from '../mealWord';

const at = (h: number, m = 0) => new Date(2026, 8, 29, h, m);

describe('mealWord', () => {
  it.each([
    [7, 0, 'breakfast'],
    [10, 29, 'breakfast'],
    [10, 30, 'lunch'],
    [12, 30, 'lunch'],
    [15, 59, 'lunch'],
    [16, 0, 'dinner'],
    [20, 0, 'dinner'],
    [1, 0, 'dinner'], // late-night food
    [4, 0, 'breakfast'],
  ])('%i:%i is %s', (h, m, expected) => {
    expect(mealWord(at(h, m))).toBe(expected);
  });

  it('accepts ISO strings', () => {
    expect(mealWord(at(19).toISOString())).toBe('dinner');
  });

  it('capitalizes for titles', () => {
    expect(capitalize('dinner')).toBe('Dinner');
  });
});
