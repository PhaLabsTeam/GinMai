import { create } from "zustand";
import { supabase, isSupabaseConfigured, DEV_MODE } from "../config/supabase";
import type { User, UserInsert } from "../types/database";
import type { Session, AuthError, SupabaseClient } from "@supabase/supabase-js";

// Type-safe Supabase client helper (same pattern as momentStore)
const db = supabase as SupabaseClient<any>;

// DEV MODE OTP code (any 6-digit code works in dev mode)
const DEV_OTP_CODE = "123456";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, code: string, firstName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
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
        // Fetch user profile from users table
        const { data: userData, error: userError } = await db
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (userError && userError.code !== "PGRST116") {
          console.error("Error fetching user profile:", userError);
        }

        set({
          session,
          user: userData as User | null,
          loading: false,
          initialized: true,
        });
      } else {
        set({ loading: false, initialized: true });
      }

      // Listen for auth state changes
      db.auth.onAuthStateChange(async (event, newSession) => {
        console.log("Auth state changed:", event);

        if (event === "SIGNED_OUT") {
          set({ user: null, session: null });
        } else if (newSession?.user) {
          // Fetch user profile
          const { data: userData } = await db
            .from("users")
            .select("*")
            .eq("id", newSession.user.id)
            .single();

          set({
            session: newSession,
            user: userData as User | null,
          });
        }
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ loading: false, initialized: true, error: (error as Error).message });
    }
  },

  // Send OTP to phone number
  sendOtp: async (phone: string) => {
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
      const { error } = await db.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      set({ loading: false });
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      console.error("OTP send error:", authError);
      set({ loading: false, error: authError.message });
      return { success: false, error: authError.message };
    }
  },

  // Verify OTP and create/update user profile
  verifyOtp: async (phone: string, code: string, firstName: string) => {
    // DEV MODE: Accept any 6-digit code and create user in database
    if (DEV_MODE) {
      console.log(`[DEV MODE] Verifying code: ${code} for ${phone}`);

      if (code.length !== 6) {
        return { success: false, error: "Code must be 6 digits" };
      }

      set({ loading: true, error: null });

      try {
        // In DEV_MODE, use a local mock user without hitting the database
        // This avoids RLS policy issues when there's no real auth session
        // Generate a valid UUID format for consistency
        const devUserId = "00000000-0000-0000-0000-000000000001";

        const userData: User = {
          id: devUserId,
          phone,
          first_name: firstName,
          phone_verified: true,
          verified_at: new Date().toISOString(),
          meals_hosted: 0,
          meals_joined: 0,
          no_shows: 0,
          push_token: null,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log("[DEV MODE] Using local mock user:", userData.first_name);

        set({ user: userData, loading: false, initialized: true });
        return { success: true };
      } catch (error) {
        console.error("[DEV MODE] Error:", error);
        set({ loading: false, error: (error as Error).message });
        return { success: false, error: (error as Error).message };
      }
    }

    if (!isSupabaseConfigured()) {
      // Mock success for development - create fake user
      console.log("Supabase not configured, mocking OTP verification");
      const mockUser: User = {
        id: "mock-user-id",
        phone,
        first_name: firstName,
        phone_verified: true,
        verified_at: new Date().toISOString(),
        meals_hosted: 0,
        meals_joined: 0,
        no_shows: 0,
        push_token: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set({ user: mockUser, initialized: true });
      return { success: true };
    }

    set({ loading: true, error: null });

    try {
      // Verify the OTP
      const { data: authData, error: verifyError } = await db.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      if (!authData.user) {
        throw new Error("No user returned after verification");
      }

      // Check if user profile exists
      const { data: existingUser, error: fetchError } = await db
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      let userData: User;

      if (fetchError?.code === "PGRST116" || !existingUser) {
        // User doesn't exist, create profile
        const { data: newUser, error: insertError } = await db
          .from("users")
          .insert({
            id: authData.user.id,
            phone,
            first_name: firstName,
            phone_verified: true,
            verified_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        userData = newUser as User;
      } else if (fetchError) {
        throw fetchError;
      } else {
        // User exists, update first_name if needed
        if ((existingUser as User).first_name !== firstName) {
          const { data: updatedUser, error: updateError } = await db
            .from("users")
            .update({ first_name: firstName })
            .eq("id", authData.user.id)
            .select()
            .single();

          if (updateError) throw updateError;
          userData = updatedUser as User;
        } else {
          userData = existingUser as User;
        }
      }

      set({
        session: authData.session,
        user: userData,
        loading: false,
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      console.error("OTP verification error:", authError);
      set({ loading: false, error: authError.message });
      return { success: false, error: authError.message };
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

  clearError: () => set({ error: null }),
}));
