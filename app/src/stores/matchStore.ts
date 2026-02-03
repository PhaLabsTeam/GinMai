import { create } from "zustand";
import { supabase, isSupabaseConfigured, DEV_MODE } from "../config/supabase";
import type { EatAgainMatch, EatAgainMatchInsert } from "../types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushNotification, NotificationTemplates } from "../utils/sendPushNotification";
import { getUserPushToken } from "../config/notifications";

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
  checkForMatch: (momentId: string, fromUserId: string, aboutUserId: string) => Promise<boolean>;
  fetchUserMatches: (userId: string) => Promise<void>;
  getMatchedUsers: () => MatchedUser[];
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  matchedUsers: [],
  loading: false,
  error: null,

  /**
   * Check if there's a mutual "eat again" match
   * Called after user submits feedback with eat_again: true
   */
  checkForMatch: async (momentId: string, fromUserId: string, aboutUserId: string) => {
    if (DEV_MODE || !isSupabaseConfigured()) {
      console.log("[DEV MODE] Would check for eat-again match");
      return false;
    }

    try {
      // Check if the other user also selected "eat again" for this user
      const { data: otherFeedback, error: feedbackError } = await db
        .from("feedback")
        .select("eat_again")
        .eq("moment_id", momentId)
        .eq("from_user", aboutUserId)
        .eq("about_user", fromUserId)
        .eq("eat_again", true)
        .maybeSingle();

      if (feedbackError) {
        console.error("Error checking feedback:", feedbackError);
        return false;
      }

      // If other user also selected "eat again", create a match
      if (otherFeedback) {
        console.log("🎉 Mutual eat-again match found!");

        // Create match record (order users alphabetically to avoid duplicates)
        const [userA, userB] = [fromUserId, aboutUserId].sort();

        const matchData: EatAgainMatchInsert = {
          user_a_id: userA,
          user_b_id: userB,
          moment_id: momentId,
        };

        const { data: match, error: matchError } = await db
          .from("eat_again_matches")
          .insert(matchData)
          .select()
          .single();

        if (matchError) {
          // Might already exist, that's okay
          if (matchError.code === '23505') {
            console.log("Match already exists");
            return true;
          }
          console.error("Error creating match:", matchError);
          return false;
        }

        // Fetch matched user's info for notification
        const { data: matchedUserData } = await db
          .from("users")
          .select("first_name, push_token")
          .eq("id", aboutUserId)
          .single();

        // Send push notification to both users
        if (matchedUserData) {
          // Notify the other user
          if (matchedUserData.push_token) {
            const { data: currentUserData } = await db
              .from("users")
              .select("first_name")
              .eq("id", fromUserId)
              .single();

            if (currentUserData) {
              await sendPushNotification(
                NotificationTemplates.eatAgainMatch(
                  matchedUserData.push_token,
                  currentUserData.first_name
                )
              );
            }
          }

          // Notify current user
          const currentUserToken = await getUserPushToken(fromUserId, db);
          if (currentUserToken) {
            await sendPushNotification(
              NotificationTemplates.eatAgainMatch(
                currentUserToken,
                matchedUserData.first_name
              )
            );
          }
        }

        console.log("✅ Match created and notifications sent");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking for match:", error);
      return false;
    }
  },

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

      // Fetch matched users' info using the get_user_connections function
      const { data: users, error: usersError } = await db.rpc(
        "get_user_connections",
        { p_user_id: userId }
      );

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
