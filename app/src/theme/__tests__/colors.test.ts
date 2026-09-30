import { colors } from '../colors';

// tailwind.config.js and src/theme/colors.ts describe the same palette
const tailwind = require('../../../tailwind.config.js').theme.extend.colors;

const flatten = (obj: Record<string, any>, prefix = ''): Record<string, string> =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    const name = key === 'DEFAULT' ? prefix : prefix ? `${prefix}-${key}` : key;
    return typeof value === 'string' ? { ...acc, [name]: value } : { ...acc, ...flatten(value, name) };
  }, {} as Record<string, string>);

const camel = (name: string) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

describe('theme colors', () => {
  it('matches the Tailwind palette exactly', () => {
    const fromTailwind = Object.fromEntries(
      Object.entries(flatten(tailwind)).map(([name, value]) => [camel(name), value])
    );
    expect(fromTailwind).toEqual(colors);
  });
});
