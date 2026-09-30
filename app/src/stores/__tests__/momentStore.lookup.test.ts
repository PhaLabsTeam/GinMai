// Moments that leave the map list (full, completed, deep-linked) must still be
// found by the screens and actions about them (#42).

jest.mock('../../config/supabase', () => {
  const results: any[] = [];
  const query: any = {};
  for (const m of ['select', 'eq', 'in', 'gte', 'order', 'limit', 'update']) {
    query[m] = jest.fn(() => query);
  }
  query.maybeSingle = jest.fn(async () => results.shift());
  // `await`ing the builder itself resolves the next queued result
  query.then = (resolve: any, reject: any) => Promise.resolve(results.shift()).then(resolve, reject);
  return {
    supabase: { from: jest.fn(() => query) },
    isSupabaseConfigured: () => true,
    DEV_MODE: false,
    __results: results,
    __query: query,
  };
});

import { useMomentStore } from '../momentStore';
const { __results: results, __query: query } = require('../../config/supabase');

const row = (overrides: Record<string, any> = {}) => ({
  id: 'm1',
  host_id: 'host-1',
  host_name: 'Kiss',
  starts_at: '2026-09-29T06:00:00Z',
  duration: 'normal',
  lat: 18.79,
  lng: 98.97,
  place_name: 'Khao Soi Mae Sai',
  area_name: 'Nimman',
  seats_total: 2,
  seats_taken: 2,
  note: null,
  status: 'full',
  created_at: '2026-09-29T05:00:00Z',
  expires_at: '2099-01-01T00:00:00Z',
  ...overrides,
});

describe('momentStore lookups for Moments outside the map list', () => {
  beforeEach(() => {
    results.length = 0;
    jest.clearAllMocks();
    useMomentStore.setState({ moments: [], momentsById: {} });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => (console.error as jest.Mock).mockRestore());

  it('fetches a full Moment by id and finds it afterwards', async () => {
    results.push({ data: row(), error: null });

    const moment = await useMomentStore.getState().fetchMomentById('m1');

    expect(moment?.status).toBe('full');
    expect(useMomentStore.getState().findMoment('m1')?.location.place_name).toBe('Khao Soi Mae Sai');
    expect(useMomentStore.getState().moments).toEqual([]); // the map list stays active-only
  });

  it('keeps updates flowing to a cached Moment', async () => {
    results.push({ data: row({ status: 'active', seats_taken: 1 }), error: null });
    await useMomentStore.getState().fetchMomentById('m1');

    useMomentStore.getState().updateMoment('m1', { seats_taken: 2, status: 'full' });

    expect(useMomentStore.getState().findMoment('m1')).toEqual(
      expect.objectContaining({ seats_taken: 2, status: 'full' })
    );
  });

  it('gives the seat back when a guest leaves a full Moment', async () => {
    useMomentStore.setState({ momentsById: {} });
    results.push({ data: row(), error: null });
    await useMomentStore.getState().fetchMomentById('m1');

    // leaveMoment: update connection, then decrement seats
    results.push({ data: null, error: null }, { data: null, error: null });
    await useMomentStore.getState().leaveMoment('m1', 'guest-1');

    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ seats_taken: 1 }));
  });

  it('finds the Moment a user is hosting, including when full', async () => {
    results.push({ data: [row()], error: null });

    const active = await useMomentStore.getState().fetchMyActiveMoment('host-1');

    expect(active?.role).toBe('host');
    expect(query.in).toHaveBeenCalledWith('status', ['active', 'full']);
  });

  it('falls back to a Moment the user joined', async () => {
    results.push(
      { data: [], error: null }, // nothing hosted
      { data: [{ moment_id: 'm1' }], error: null }, // confirmed connection
      { data: [row({ host_id: 'someone-else' })], error: null }
    );

    const active = await useMomentStore.getState().fetchMyActiveMoment('guest-1');

    expect(active?.role).toBe('guest');
    expect(active?.moment.id).toBe('m1');
  });

  it('returns null when the user has nothing planned', async () => {
    results.push({ data: [], error: null }, { data: [], error: null });

    expect(await useMomentStore.getState().fetchMyActiveMoment('user-1')).toBeNull();
  });
});
