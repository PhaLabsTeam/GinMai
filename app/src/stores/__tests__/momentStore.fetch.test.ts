// fetchNearbyMoments against a mocked Supabase client: a failed load must be
// reported as an error, not look like an empty city (#9).

jest.mock('../../config/supabase', () => {
  const query: any = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    gte: jest.fn(() => query),
    order: jest.fn(),
  };
  return {
    supabase: { from: jest.fn(() => query) },
    isSupabaseConfigured: () => true,
    DEV_MODE: false,
    __query: query,
  };
});

import { useMomentStore } from '../momentStore';
const { __query: query } = require('../../config/supabase');

describe('momentStore.fetchNearbyMoments', () => {
  beforeEach(() => {
    useMomentStore.setState({ moments: [], loading: false, error: null });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('sets error when the request fails', async () => {
    query.order.mockResolvedValueOnce({
      data: null,
      error: { message: 'SyntaxError: JSON Parse error: Unexpected character: <' },
    });

    await useMomentStore.getState().fetchNearbyMoments(18.79, 98.97);

    const state = useMomentStore.getState();
    expect(state.error).toMatch(/JSON Parse error/);
    expect(state.loading).toBe(false);
    expect(state.moments).toEqual([]);
  });

  it('clears a previous error on success', async () => {
    useMomentStore.setState({ error: 'old failure' });
    query.order.mockResolvedValueOnce({ data: [], error: null });

    await useMomentStore.getState().fetchNearbyMoments(18.79, 98.97);

    expect(useMomentStore.getState().error).toBeNull();
  });
});
