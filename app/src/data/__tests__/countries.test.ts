import { ALL_COUNTRIES, COMMON_COUNTRIES, searchCountries, countryForNumber } from '../countries';

describe('countries', () => {
  it('lists common countries first, Thailand at the top', () => {
    expect(ALL_COUNTRIES[0].country).toBe('Thailand');
    expect(ALL_COUNTRIES.slice(0, COMMON_COUNTRIES.length)).toEqual(COMMON_COUNTRIES);
  });

  it('has no duplicate country names and only well-formed dial codes', () => {
    const names = ALL_COUNTRIES.map((c) => c.country);
    expect(new Set(names).size).toBe(names.length);
    for (const c of ALL_COUNTRIES) expect(c.code).toMatch(/^\+\d{1,3}$/);
  });

  it('searches by name or dial code', () => {
    expect(searchCountries('ger').map((c) => c.country)).toEqual(['Germany']);
    expect(searchCountries('+49').map((c) => c.country)).toEqual(['Germany']);
    expect(searchCountries('viet').map((c) => c.country)).toEqual(['Vietnam']);
    expect(searchCountries('  ')).toHaveLength(ALL_COUNTRIES.length);
  });

  it('matches the longest dial code for a number', () => {
    expect(countryForNumber('+66999999999')?.country).toBe('Thailand');
    expect(countryForNumber('+972501234567')?.country).toBe('Israel');
    expect(countryForNumber('+14155550123')?.code).toBe('+1');
    expect(countryForNumber('+358401234567')?.country).toBe('Finland');
  });
});
