// Re-joining (#49), "eat again" feedback (#43) and per-user reset (#50).

jest.mock('../../config/supabase', () => {
  const results: any[] = [];
  const query: any = {};
  for (const m of ['select', 'eq', 'in', 'update', 'insert']) query[m] = jest.fn(() => query);
  query.maybeSingle = jest.fn(async () => results.shift());
  query.then = (resolve: any, reject: any) => Promise.resolve(results.shift()).then(resolve, reject);
  return {
    supabase: { from: jest.fn(() => query), rpc: jest.fn(async () => ({ error: null })) },
    isSupabaseConfigured: () => true,
    DEV_MODE: false,
    __results: results,
    __query: query,
  };
});


import { useMomentStore } from '../momentStore';
const { __results: results, __query: query } = require('../../config/supabase');

const moment = {
  id: 'm1', host_id: 'host', host_name: 'Tester', starts_at: '2026-09-30T12:00:00Z', duration: 'normal',
  location: { lat: 18.79, lng: 98.97 }, seats_total: 2, seats_taken: 0, status: 'active',
  created_at: '2026-09-30T11:00:00Z', expires_at: '2099-01-01T00:00:00Z',
} as any;

describe('momentStore Phase 7 fixes', () => {
  beforeEach(() => {
    results.length = 0;
    jest.clearAllMocks();
    useMomentStore.setState({ moments: [moment], momentsById: {}, userConnections: [], hiddenUserIds: [] });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => (console.error as jest.Mock).mockRestore());

  it('re-joins by reviving the cancelled connection (#49)', async () => {
    results.push(
      { data: { id: 'c1', status: 'cancelled' }, error: null }, // existing row
      { data: null, error: null }, // update connection
      { data: null, error: null } // update seats
    );

    const result = await useMomentStore.getState().joinMoment('m1', 'guest');

    expect(result.success).toBe(true);
    expect(query.insert).not.toHaveBeenCalled();
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'confirmed', cancelled_at: null }));
  });

  it('inserts on a first join', async () => {
    results.push({ data: null, error: null }, { data: null, error: null }, { data: null, error: null });

    const result = await useMomentStore.getState().joinMoment('m1', 'guest');

    expect(result.success).toBe(true);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ moment_id: 'm1', user_id: 'guest' }));
  });

  it('reports "eat again" feedback as sent; matching is left to the database (#43)', async () => {
    const { supabase } = require('../../config/supabase');
    results.push({ data: null, error: null }); // feedback insert

    const result = await useMomentStore.getState().submitFeedback({
      momentId: 'm1', fromUserId: 'guest', aboutUserId: 'host', rating: 'great', eatAgain: true,
    });

    expect(result.success).toBe(true);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ eat_again: true }));
    // No client-side match creation (#55)
    expect(supabase.from).not.toHaveBeenCalledWith('eat_again_matches');
  });

  it('forgets the previous account on reset, keeps the map (#50)', () => {
    useMomentStore.setState({
      userConnections: [{ momentId: 'm1', status: 'confirmed', joinedAt: 'x' }] as any,
      momentsById: { m1: moment },
      hiddenUserIds: ['someone'],
    });

    useMomentStore.getState().resetUserState();

    const s = useMomentStore.getState();
    expect(s.userConnections).toEqual([]);
    expect(s.momentsById).toEqual({});
    expect(s.hiddenUserIds).toEqual([]);
    expect(s.moments).toHaveLength(1);
  });
});
