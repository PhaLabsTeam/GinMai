import { create } from "zustand";
import { supabase, isSupabaseConfigured, DEV_MODE } from "../config/supabase";
import type { User, UserInsert } from "../types/database";
import type { Session, AuthError, SupabaseClient } from "@supabase/supabase-js";

// Type-safe Supabase client helper (same pattern as momentStore)
const db = supabase as SupabaseClient<any>;

// DEV MODE OTP code (any 6-digit code works in dev mode)
const DEV_OTP_CODE = "123456";

// Registered once; initialize() can run again (e.g. fast refresh) without stacking listeners
let authSubscription: { unsubscribe: () => void } | null = null;

// While verifyOtp/completeProfile run they own `user`; the auth listener must not
// overwrite it with a profile fetched mid-sign-in (that race showed stale names).
// signInCount lets a listener fetch that started before a sign-in drop its result.
let signingIn = false;
let signInCount = 0;

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.error("[AUTH] Error fetching user profile:", error);
  }
  return (data as User | null) ?? null;
}

const hasName = (profile: User | null) => !!profile?.first_name?.trim();

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  // needsProfile: signed in, but no name on file yet; call completeProfile next
  verifyOtp: (phone: string, code: string) => Promise<{ success: boolean; needsProfile?: boolean; error?: string }>;
  completeProfile: (phone: string, firstName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updatePreferences: (
    prefs: Partial<Pick<User, "notify_reminders" | "notify_joins">>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  updateFirstName: (firstName: string) => Promise<{ success: boolean; error?: string }>;
  updatePushToken: (token: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  error: null,

  // Initialize auth state from persisted session
  initialize: async () => {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, skipping auth initialization");
      set({ initialized: true });
      return;
    }

    try {
      set({ loading: true });

      // Get current session
      const { data: { session }, error: sessionError } = await db.auth.getSession();

      if (sessionError) throw sessionError;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);

        set({
          session,
          // A session without a name means sign-up was abandoned at the name step
          user: hasName(profile) ? profile : null,
          loading: false,
          initialized: true,
        });
      } else {
        set({ loading: false, initialized: true });
      }

      if (!authSubscription) {
        const { data } = db.auth.onAuthStateChange((event, newSession) => {
          console.log("Auth state changed:", event);

          if (event === "SIGNED_OUT") {
            set({ user: null, session: null });
            return;
          }
          if (!newSession?.user) return;

          set({ session: newSession });

          const userId = newSession.user.id;
          if (signingIn || get().user?.id === userId) return;

          const startedAt = signInCount;
          // supabase-js can deadlock if this callback awaits other Supabase calls
          setTimeout(async () => {
            const profile = await fetchProfile(userId);
            // Drop the result if a sign-in ran or the session changed meanwhile
            if (signingIn || signInCount !== startedAt || get().session?.user.id !== userId) return;
            if (hasName(profile)) set({ user: profile });
          }, 0);
        });
        authSubscription = data.subscription;
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ loading: false, initialized: true, error: (error as Error).message });
    }
  },

  // Send OTP to phone number
  sendOtp: async (phone: string) => {
    console.log("[AUTH] sendOtp called with phone:", phone);
    console.log("[AUTH] DEV_MODE:", DEV_MODE);
    console.log("[AUTH] isSupabaseConfigured:", isSupabaseConfigured());

    // DEV MODE: Skip actual SMS sending
    if (DEV_MODE) {
      console.log(`[DEV MODE] OTP would be sent to ${phone}. Use code: ${DEV_OTP_CODE}`);
      set({ loading: false });
      return { success: true };
    }

    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, mocking OTP send");
      return { success: true };
    }

    set({ loading: true, error: null });

    try {
      console.log("[AUTH] Calling Supabase signInWithOtp...");
      const { error } = await db.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("[AUTH] signInWithOtp error:", error);
        throw error;
      }

      console.log("[AUTH] OTP sent successfully");
      set({ loading: false });
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      console.error("[AUTH] OTP send error:", authError);
      set({ loading: false, error: authError.message });
      return { success: false, error: authError.message };
    }
  },

  // Verify the OTP. Existing profiles are loaded as-is; the name is only asked
  // for (via completeProfile) when there's no profile yet.
  verifyOtp: async (phone: string, code: string) => {
    console.log("[AUTH] verifyOtp called for:", phone);

    // DEV MODE / no Supabase: accept any 6-digit code; the name step creates the mock user
    if (DEV_MODE || !isSupabaseConfigured()) {
      if (code.length !== 6) {
        return { success: false, error: "Code must be 6 digits" };
      }
      return { success: true, needsProfile: true };
    }

    signingIn = true;
    signInCount++;
    set({ loading: true, error: null });

    try {
      const { data: authData, error: verifyError } = await db.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (verifyError) throw verifyError;
      if (!authData.user) throw new Error("No user returned after verification");

      const profile = await fetchProfile(authData.user.id);
      const needsProfile = !hasName(profile);

      set({
        session: authData.session,
        user: needsProfile ? null : profile,
        loading: false,
      });

      return { success: true, needsProfile };
    } catch (error) {
      const authError = error as AuthError;
      console.error("[AUTH] OTP verification error:", authError);
      set({ loading: false, error: authError.message });
      return { success: false, error: authError.message };
    } finally {
      signingIn = false;
    }
  },

  // Create the profile for a newly verified user
  completeProfile: async (phone: string, firstName: string) => {
    const name = firstName.trim();
    if (!name) return { success: false, error: "Name is required" };

    if (DEV_MODE || !isSupabaseConfigured()) {
      const now = new Date().toISOString();
      const mockUser: User = {
        id: "00000000-0000-0000-0000-000000000001",
        phone,
        first_name: name,
        phone_verified: true,
        verified_at: now,
        meals_hosted: 0,
        meals_joined: 0,
        no_shows: 0,
        push_token: null,
        notify_reminders: true,
        notify_joins: true,
        status: "active",
        created_at: now,
        updated_at: now,
      };
      set({ user: mockUser, initialized: true });
      return { success: true };
    }

    const userId = get().session?.user.id;
    if (!userId) return { success: false, error: "Not signed in" };

    signingIn = true;
    signInCount++;
    set({ loading: true, error: null });

    try {
      const { data, error } = await db
        .from("users")
        .upsert(
          {
            id: userId,
            phone,
            first_name: name,
            phone_verified: true,
            verified_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error) throw error;

      set({ user: data as User, loading: false });
      return { success: true };
    } catch (error) {
      const message = (error as Error).message;
      console.error("[AUTH] completeProfile error:", error);
      set({ loading: false, error: message });
      return { success: false, error: message };
    } finally {
      signingIn = false;
    }
  },

  // Sign out
  signOut: async () => {
    if (!isSupabaseConfigured()) {
      set({ user: null, session: null });
      return;
    }

    set({ loading: true });

    try {
      await db.auth.signOut();
      set({ user: null, session: null, loading: false });
    } catch (error) {
      console.error("Sign out error:", error);
      set({ loading: false, error: (error as Error).message });
    }
  },

  updateFirstName: async (firstName) => {
    const { user } = get();
    const name = firstName.trim();
    if (!user) return { success: false, error: "Not signed in" };
    if (!name || name.length > 30) return { success: false, error: "Use 1 to 30 characters" };
    if (DEV_MODE || !isSupabaseConfigured()) {
      set({ user: { ...user, first_name: name } });
      return { success: true };
    }
    const { error } = await db.from("users").update({ first_name: name }).eq("id", user.id);
    if (error) {
      console.error("[AUTH] updateFirstName error:", error);
      return { success: false, error: error.message };
    }
    set({ user: { ...user, first_name: name } });
    return { success: true };
  },

  // Optimistic: the switch moves immediately and is put back if the save fails
  updatePreferences: async (prefs) => {
    const { user } = get();
    if (!user) return { success: false, error: "Not signed in" };

    const previous = { notify_reminders: user.notify_reminders, notify_joins: user.notify_joins };
    set({ user: { ...user, ...prefs } });

    if (DEV_MODE || !isSupabaseConfigured()) return { success: true };

    const { error } = await db.from("users").update(prefs).eq("id", user.id);
    if (error) {
      console.error("[AUTH] updatePreferences error:", error);
      const current = get().user;
      if (current?.id === user.id) set({ user: { ...current, ...previous } });
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  // Deletes the profile and auth user server-side (delete_my_account), then
  // clears the local session. The session is gone either way afterwards.
  deleteAccount: async () => {
    if (!get().user) return { success: false, error: "Not signed in" };
    if (DEV_MODE || !isSupabaseConfigured()) {
      set({ user: null, session: null });
      return { success: true };
    }

    set({ loading: true, error: null });
    const { error } = await db.rpc("delete_my_account");
    if (error) {
      console.error("[AUTH] deleteAccount error:", error);
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }

    // The auth user no longer exists, so a server sign-out may fail; clear locally regardless
    await db.auth.signOut({ scope: "local" }).catch(() => {});
    set({ user: null, session: null, loading: false });
    return { success: true };
  },

  // Update push notification token
  updatePushToken: async (token: string) => {
    const { user } = get();

    if (!user) {
      console.warn("Cannot update push token: no user logged in");
      return;
    }

    // In DEV_MODE, just update local state without database call
    if (DEV_MODE) {
      console.log("[DEV MODE] Push token would be saved:", token);
      set({
        user: {
          ...user,
          push_token: token,
        },
      });
      return;
    }

    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, skipping push token update");
      return;
    }

    try {
      const { error } = await db
        .from("users")
        .update({ push_token: token })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating push token:", error);
        return;
      }

      console.log("✅ Push token saved to database");

      // Update local state
      set({
        user: {
          ...user,
          push_token: token,
        },
      });
    } catch (error) {
      console.error("Error updating push token:", error);
    }
  },

  clearError: () => set({ error: null }),
}));
