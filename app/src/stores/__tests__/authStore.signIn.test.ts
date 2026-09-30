// Sign-in flow against a mocked Supabase client. The store keeps module-level
// state (listener subscription, sign-in guard), so each test loads a fresh copy.

type Listener = (event: string, session: any) => void;

jest.mock('../../config/supabase', () => {
  const state: { listener: Listener | null; profileReads: any[] } = {
    listener: null,
    profileReads: [],
  };

  const query: any = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    // Each profile read returns the next queued result (or null)
    maybeSingle: jest.fn(async () => ({ data: state.profileReads.shift() ?? null, error: null })),
    upsert: jest.fn(() => query),
    single: jest.fn(async () => ({ data: null, error: null })),
  };

  const supabase = {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn((cb: Listener) => {
        state.listener = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
      verifyOtp: jest.fn(),
      signOut: jest.fn(async () => ({ error: null })),
    },
    from: jest.fn(() => query),
    // my_profile() (#62): each profile read returns the next queued result
    // same queue as a direct read, so tests can steer either
    rpc: jest.fn(async () => {
      const { data, error } = await query.maybeSingle();
      return { data: data ? [data] : [], error };
    }),
  };

  return {
    supabase,
    isSupabaseConfigured: () => true,
    DEV_MODE: false,
    __state: state,
    __query: query,
  };
});

const session = { user: { id: 'user-1', phone: '66999999999' } };
const profile = (first_name: string) => ({ id: 'user-1', phone: '+66999999999', first_name });

function load() {
  let mod: any;
  jest.isolateModules(() => {
    mod = {
      store: require('../authStore').useAuthStore,
      mock: require('../../config/supabase'),
    };
  });
  return mod as { store: any; mock: any };
}

const flushTimers = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('authStore sign-in', () => {
  it('registers the auth listener only once across initialize calls', async () => {
    const { store, mock } = load();
    await store.getState().initialize();
    await store.getState().initialize();
    expect(mock.supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('keeps the verified profile when the listener fires mid-verify (#1)', async () => {
    const { store, mock } = load();
    await store.getState().initialize();

    // First read is verifyOtp's; anything after would be the listener's stale read
    mock.__state.profileReads.push(profile('Tester'), profile('kiss'));
    mock.supabase.auth.verifyOtp.mockImplementation(async () => {
      mock.__state.listener!('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    });

    const result = await store.getState().verifyOtp('+66999999999', '123456');
    await flushTimers();

    expect(result).toEqual({ success: true, needsProfile: false });
    expect(store.getState().user.first_name).toBe('Tester');
    expect(mock.__query.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('does not write the name for a returning user (#2)', async () => {
    const { store, mock } = load();
    mock.__state.profileReads.push(profile('kiss'));
    mock.supabase.auth.verifyOtp.mockResolvedValue({ data: { user: session.user, session }, error: null });

    const result = await store.getState().verifyOtp('+66999999999', '123456');

    expect(result.needsProfile).toBe(false);
    expect(store.getState().user.first_name).toBe('kiss');
    expect(mock.__query.upsert).not.toHaveBeenCalled();
  });

  it('asks new users for a name, then creates the profile (#2)', async () => {
    const { store, mock } = load();
    mock.supabase.auth.verifyOtp.mockResolvedValue({ data: { user: session.user, session }, error: null });

    const result = await store.getState().verifyOtp('+66999999999', '123456');
    expect(result).toEqual({ success: true, needsProfile: true });
    expect(store.getState().user).toBeNull();

    mock.__state.profileReads.push(profile('Tester')); // read back after the upsert
    const saved = await store.getState().completeProfile('+66999999999', '  Tester ');

    expect(saved.success).toBe(true);
    expect(mock.__query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', first_name: 'Tester' }),
      { onConflict: 'id' }
    );
    expect(store.getState().user.first_name).toBe('Tester');
    // Own profile comes from my_profile(); others can't read phone numbers (#62)
    expect(mock.supabase.rpc).toHaveBeenCalledWith('my_profile');
    expect(mock.__query.select).not.toHaveBeenCalledWith('*');
  });

  it('ignores a stale listener fetch that lands after sign-in', async () => {
    const { store, mock } = load();
    await store.getState().initialize();

    // Listener fires before sign-in starts; its deferred read resolves late with an old name
    mock.__state.profileReads.push(profile('kiss'));
    mock.__state.listener!('TOKEN_REFRESHED', session);

    mock.supabase.auth.verifyOtp.mockResolvedValue({ data: { user: session.user, session }, error: null });
    mock.__query.maybeSingle.mockImplementationOnce(async () => ({ data: profile('Tester'), error: null }));
    const pending = store.getState().verifyOtp('+66999999999', '123456');

    await pending;
    await flushTimers();

    expect(store.getState().user.first_name).toBe('Tester');
  });

  it('returns the raw error so the screen can map it', async () => {
    const { store, mock } = load();
    mock.supabase.auth.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Token has expired or is invalid' },
    });

    const result = await store.getState().verifyOtp('+66999999999', '000000');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Token has expired or is invalid');
  });
});
