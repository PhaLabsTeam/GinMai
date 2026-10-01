import { create } from "zustand";
import { supabase, isSupabaseConfigured, DEV_MODE } from "../config/supabase";
import type { EatAgainMatch, EatAgainMatchInsert } from "../types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

const db = supabase as SupabaseClient<any>;

export interface MatchedUser {
  userId: string;
  firstName: string;
  phoneVerified: boolean;
  mealsHosted: number;
  mealsJoined: number;
  lastMealTogether: string;
  totalMealsTogether: number;
}

interface MatchState {
  matches: EatAgainMatch[];
  matchedUsers: MatchedUser[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchUserMatches: (userId: string) => Promise<void>;
  getMatchedUsers: () => MatchedUser[];
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  matchedUsers: [],
  loading: false,
  error: null,


  /**
   * Fetch all matches for a user
   */
  fetchUserMatches: async (userId: string) => {
    if (DEV_MODE || !isSupabaseConfigured()) {
      console.log("[DEV MODE] Would fetch user matches");
      set({ matchedUsers: [] });
      return;
    }

    set({ loading: true, error: null });

    try {
      // Get all matches where user is involved
      const { data: matches, error: matchError } = await db
        .from("eat_again_matches")
        .select("*")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order("matched_at", { ascending: false });

      if (matchError) throw matchError;

      set({ matches: matches || [] });

      // Get user IDs of matched users
      const matchedUserIds = matches
        ?.map((match) =>
          match.user_a_id === userId ? match.user_b_id : match.user_a_id
        )
        .filter((id, index, self) => self.indexOf(id) === index) || []; // Remove duplicates

      if (matchedUserIds.length === 0) {
        set({ matchedUsers: [], loading: false });
        return;
      }

      // The caller's Connections; the database works out who they are (#69)
      const { data: users, error: usersError } = await db.rpc("my_connections");

      if (usersError) {
        console.error("Error fetching matched users:", usersError);
        set({ loading: false });
        return;
      }

      // Build matched users list with additional info
      const matchedUsers: MatchedUser[] = (users || []).map((user: any) => {
        // Find most recent match with this user
        const userMatches = matches?.filter(
          (m) => m.user_a_id === user.user_id || m.user_b_id === user.user_id
        ) || [];

        const lastMatch = userMatches[0]; // Already sorted by matched_at desc

        return {
          userId: user.user_id,
          firstName: user.first_name,
          phoneVerified: user.phone_verified,
          mealsHosted: user.meals_hosted,
          mealsJoined: user.meals_joined,
          lastMealTogether: lastMatch?.matched_at || "",
          totalMealsTogether: userMatches.length,
        };
      });

      set({ matchedUsers, loading: false });
    } catch (error) {
      console.error("Error fetching user matches:", error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  /**
   * Get matched users from state
   */
  getMatchedUsers: () => get().matchedUsers,
}));
