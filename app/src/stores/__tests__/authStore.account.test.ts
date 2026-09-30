// Settings preferences (#6) and account deletion (#7) against a mocked Supabase.

jest.mock('../../config/supabase', () => {
  const query: any = {
    update: jest.fn(() => query),
    eq: jest.fn(async () => ({ error: null })),
  };
  return {
    supabase: {
      from: jest.fn(() => query),
      rpc: jest.fn(async () => ({ error: null })),
      auth: { signOut: jest.fn(async () => ({ error: null })) },
    },
    isSupabaseConfigured: () => true,
    DEV_MODE: false,
    __query: query,
  };
});

import { useAuthStore } from '../authStore';
const { supabase, __query: query } = require('../../config/supabase');

const user = {
  id: 'user-1',
  phone: '+66999999999',
  first_name: 'Tester',
  notify_reminders: true,
  notify_joins: true,
} as any;

describe('authStore preferences and account deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user, session: { user: { id: 'user-1' } } as any, loading: false });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => (console.error as jest.Mock).mockRestore());

  it('saves a preference to the profile (#6)', async () => {
    const result = await useAuthStore.getState().updatePreferences({ notify_reminders: false });

    expect(result.success).toBe(true);
    expect(query.update).toHaveBeenCalledWith({ notify_reminders: false });
    expect(query.eq).toHaveBeenCalledWith('id', 'user-1');
    expect(useAuthStore.getState().user?.notify_reminders).toBe(false);
  });

  it('puts the switch back when saving fails', async () => {
    query.eq.mockResolvedValueOnce({ error: { message: 'offline' } });

    const result = await useAuthStore.getState().updatePreferences({ notify_joins: false });

    expect(result.success).toBe(false);
    expect(useAuthStore.getState().user?.notify_joins).toBe(true);
  });

  it('deletes the account server-side and clears the session (#7)', async () => {
    const result = await useAuthStore.getState().deleteAccount();

    expect(result.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('delete_my_account');
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('keeps the user signed in when deletion fails', async () => {
    supabase.rpc.mockResolvedValueOnce({ error: { message: 'Not signed in' } });

    const result = await useAuthStore.getState().deleteAccount();

    expect(result.success).toBe(false);
    expect(useAuthStore.getState().user?.id).toBe('user-1');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
