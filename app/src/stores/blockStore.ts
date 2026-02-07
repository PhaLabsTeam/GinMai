import { create } from "zustand";
import { supabase } from "../config/supabase";
import type { Block, BlockInsert } from "../types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// Type-safe Supabase client helper
const db = supabase as SupabaseClient<any>;

interface BlockedUserInfo {
  id: string;
  blocked_id: string;
  first_name: string;
  phone_verified: boolean;
  created_at: string; // When the block was created
}

interface BlockState {
  blocks: Block[];
  blockedUsers: BlockedUserInfo[];
  loading: boolean;
  error: string | null;

  // Block a user
  blockUser: (blockedUserId: string) => Promise<boolean>;

  // Unblock a user
  unblockUser: (blockedUserId: string) => Promise<boolean>;

  // Check if a user is blocked
  isUserBlocked: (userId: string) => boolean;

  // Fetch user's blocks
  fetchBlocks: (userId: string) => Promise<void>;

  // Clear blocks
  clearBlocks: () => void;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blocks: [],
  blockedUsers: [],
  loading: false,
  error: null,

  blockUser: async (blockedUserId: string) => {
    set({ loading: true, error: null });

    try {
      // Get current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user");
        set({ error: "Not authenticated", loading: false });
        return false;
      }

      const blockData: BlockInsert = {
        blocker_id: user.id,
        blocked_id: blockedUserId,
      };

      const { data: block, error } = await db
        .from("blocks")
        .insert(blockData)
        .select()
        .single();

      if (error) {
        console.error("Error blocking user:", error);
        set({ error: error.message, loading: false });
        return false;
      }

      console.log("✅ User blocked:", blockedUserId);

      // Add to local state
      set((state) => ({
        blocks: [...state.blocks, block],
        loading: false,
      }));

      // Refresh the blocks list to get user info
      await get().fetchBlocks(user.id);

      return true;
    } catch (error: any) {
      console.error("Error blocking user:", error);
      set({ error: error.message || "Failed to block user", loading: false });
      return false;
    }
  },

  unblockUser: async (blockedUserId: string) => {
    set({ loading: true, error: null });

    try {
      // Get current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user");
        set({ error: "Not authenticated", loading: false });
        return false;
      }

      const { error } = await db
        .from("blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", blockedUserId);

      if (error) {
        console.error("Error unblocking user:", error);
        set({ error: error.message, loading: false });
        return false;
      }

      console.log("✅ User unblocked:", blockedUserId);

      // Remove from local state
      set((state) => ({
        blocks: state.blocks.filter((b) => b.blocked_id !== blockedUserId),
        blockedUsers: state.blockedUsers.filter((u) => u.blocked_id !== blockedUserId),
        loading: false,
      }));

      return true;
    } catch (error: any) {
      console.error("Error unblocking user:", error);
      set({ error: error.message || "Failed to unblock user", loading: false });
      return false;
    }
  },

  isUserBlocked: (userId: string) => {
    const { blocks } = get();
    return blocks.some((block) => block.blocked_id === userId);
  },

  fetchBlocks: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      // Fetch blocks with user information
      const { data, error } = await db
        .from("blocks")
        .select(`
          id,
          blocked_id,
          created_at,
          users:blocked_id (
            first_name,
            phone_verified
          )
        `)
        .eq("blocker_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching blocks:", error);
        set({ error: error.message, loading: false });
        return;
      }

      // Transform the data
      const blocks: Block[] = data.map((item: any) => ({
        id: item.id,
        blocker_id: userId,
        blocked_id: item.blocked_id,
        created_at: item.created_at,
      }));

      const blockedUsers: BlockedUserInfo[] = data.map((item: any) => ({
        id: item.id,
        blocked_id: item.blocked_id,
        first_name: item.users?.first_name || "Unknown",
        phone_verified: item.users?.phone_verified || false,
        created_at: item.created_at,
      }));

      set({ blocks, blockedUsers, loading: false });
    } catch (error: any) {
      console.error("Error fetching blocks:", error);
      set({ error: error.message || "Failed to fetch blocks", loading: false });
    }
  },

  clearBlocks: () => {
    set({ blocks: [], blockedUsers: [], error: null });
  },
}));
