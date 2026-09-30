// Blocking hides the other person's Moments (#48).

jest.mock('../../config/supabase', () => {
  const query: any = {};
  for (const m of ['select', 'eq', 'gte']) query[m] = jest.fn(() => query);
  query.order = jest.fn();
  return {
    supabase: { from: jest.fn(() => query), rpc: jest.fn() },
    isSupabaseConfigured: () => true,
    DEV_MODE: false,
    __query: query,
  };
});

import { useMomentStore } from '../momentStore';
const { supabase, __query: query } = require('../../config/supabase');

const row = (id: string, host_id: string) => ({
  id,
  host_id,
  host_name: host_id,
  starts_at: '2026-09-29T12:00:00Z',
  duration: 'normal',
  lat: 18.79,
  lng: 98.97,
  place_name: null,
  area_name: 'Nimman',
  seats_total: 2,
  seats_taken: 0,
  note: null,
  status: 'active',
  created_at: '2026-09-29T11:00:00Z',
  expires_at: '2099-01-01T00:00:00Z',
});

describe('momentStore blocking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMomentStore.setState({ moments: [], hiddenUserIds: [], error: null });
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('leaves blocked hosts off the map', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: ['blocked-host'], error: null });
    query.order.mockResolvedValueOnce({ data: [row('m1', 'friend'), row('m2', 'blocked-host')], error: null });

    await useMomentStore.getState().fetchNearbyMoments(18.79, 98.97);

    expect(supabase.rpc).toHaveBeenCalledWith('my_blocked_user_ids');
    expect(useMomentStore.getState().moments.map((m) => m.id)).toEqual(['m1']);
  });

  it('still loads the map when the blocked list is unavailable', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'function not found' } });
    query.order.mockResolvedValueOnce({ data: [row('m1', 'friend')], error: null });

    await useMomentStore.getState().fetchNearbyMoments(18.79, 98.97);

    expect(useMomentStore.getState().moments).toHaveLength(1);
    expect(useMomentStore.getState().error).toBeNull();
  });

  it('hides a just-blocked host immediately', () => {
    useMomentStore.setState({
      moments: [row('m1', 'friend'), row('m2', 'someone')].map((r: any) => ({
        ...r,
        location: { lat: r.lat, lng: r.lng },
      })) as any,
    });

    useMomentStore.getState().hideUser('someone');

    expect(useMomentStore.getState().moments.map((m) => m.id)).toEqual(['m1']);
    expect(useMomentStore.getState().hiddenUserIds).toContain('someone');
  });
});
