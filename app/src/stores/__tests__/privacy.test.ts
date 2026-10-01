// Phase 8: the app asks the database only for what the rules allow
// (#68 reports, #69 Connections).

jest.mock('../../config/supabase', () => {
  const results: any[] = [];
  const query: any = {};
  for (const m of ['select', 'eq', 'or', 'order', 'insert']) query[m] = jest.fn(() => query);
  query.single = jest.fn(async () => results.shift());
  query.then = (resolve: any, reject: any) => Promise.resolve(results.shift()).then(resolve, reject);
  return {
    supabase: { from: jest.fn(() => query), rpc: jest.fn(async () => results.shift()) },
    isSupabaseConfigured: () => true,
    DEV_MODE: false,
    __results: results,
    __query: query,
  };
});

import { useMatchStore } from '../matchStore';
import { useReportStore } from '../reportStore';
const { __results: results, __query: query, supabase } = require('../../config/supabase');

beforeEach(() => {
  results.length = 0;
  jest.clearAllMocks();
});

it("lists only the caller's Connections, without passing a user id (#69)", async () => {
  results.push(
    { data: [{ user_a_id: 'me', user_b_id: 'sam', matched_at: '2026-10-01T12:00:00Z' }], error: null },
    { data: [{ user_id: 'sam', first_name: 'Sam', phone_verified: true, meals_hosted: 1, meals_joined: 2 }], error: null }
  );

  await useMatchStore.getState().fetchUserMatches('me');

  expect(supabase.rpc).toHaveBeenCalledWith('my_connections');
  expect(supabase.rpc).not.toHaveBeenCalledWith('get_user_connections', expect.anything());
  expect(useMatchStore.getState().matchedUsers[0]).toEqual(expect.objectContaining({ firstName: 'Sam', totalMealsTogether: 1 }));
});

it('files a report without setting its status and reads back no private columns (#68)', async () => {
  results.push({ data: { id: 'r1' }, error: null });

  await useReportStore.getState().submitReport({
    reporter_id: 'me', reported_user_id: 'ben', moment_id: 'm1', category: 'other', description: null,
  });

  const sent = query.insert.mock.calls[0][0];
  expect(sent).not.toHaveProperty('status');
  expect(sent).not.toHaveProperty('reported_phone');
  const columns = query.select.mock.calls[0][0];
  expect(columns).not.toMatch(/\*|reported_phone|admin_notes|reviewed/);
});
