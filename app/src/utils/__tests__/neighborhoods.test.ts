import { areaNameFor, cleanSubdistrict, momentPlaceTitle } from '../neighborhoods';

describe('neighborhoods', () => {
  it('calls Nimman "Nimman", not "Suthep" (#30)', () => {
    // The simulator's test location, officially Tambon Suthep
    expect(areaNameFor({ lat: 18.796, lng: 98.968 }, 'Tambon Suthep')).toBe('Nimman');
  });

  it('knows the Old City', () => {
    expect(areaNameFor({ lat: 18.7885, lng: 98.9855 })).toBe('Old City');
  });

  it('falls back to the cleaned subdistrict outside known areas', () => {
    expect(areaNameFor({ lat: 18.70, lng: 98.90 }, 'Tambon Mae Hia')).toBe('Mae Hia');
    expect(areaNameFor({ lat: 18.70, lng: 98.90 }, null)).toBeNull();
  });

  it('cleans Thai admin prefixes', () => {
    expect(cleanSubdistrict('Tambon Chang Phueak')).toBe('Chang Phueak');
    expect(cleanSubdistrict('Amphoe Mueang Chiang Mai')).toBe('Mueang Chiang Mai');
  });

  it('titles Moments without a place name by area (#52)', () => {
    expect(momentPlaceTitle({ place_name: 'Khao Soi Maesai', area_name: 'Chang Phueak' })).toBe('Khao Soi Maesai');
    expect(momentPlaceTitle({ area_name: 'Nimman' })).toBe('Somewhere in Nimman');
    expect(momentPlaceTitle({})).toBe('Somewhere nearby');
  });
});
