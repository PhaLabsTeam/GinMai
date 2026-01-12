import { create } from "zustand";
import { supabase, isSupabaseConfigured, DEV_MODE } from "../config/supabase";
import type { MomentLocal } from "../types";
import type { Moment, MomentInsert } from "../types/database";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

// Type-safe Supabase client helper
const db = supabase as SupabaseClient<any>;

// Convert database moment to local format
const dbMomentToLocal = (dbMoment: Moment): MomentLocal => ({
  id: dbMoment.id,
  host_id: dbMoment.host_id || "anonymous",
  host_name: dbMoment.host_name,
  starts_at: dbMoment.starts_at,
  duration: dbMoment.duration,
  location: {
    lat: dbMoment.lat,
    lng: dbMoment.lng,
    place_name: dbMoment.place_name || undefined,
    area_name: dbMoment.area_name || undefined,
  },
  seats_total: dbMoment.seats_total,
  seats_taken: dbMoment.seats_taken,
  note: dbMoment.note || undefined,
  status: dbMoment.status,
  created_at: dbMoment.created_at,
  expires_at: dbMoment.expires_at,
});

// Check if a host_id is a dev/mock/anonymous ID that shouldn't be sent to the database
const isDevHostId = (hostId: string): boolean => {
  return hostId === "local-user" ||
         hostId === "mock-user-id" ||
         hostId === "anonymous" ||
         hostId.startsWith("dev-") ||
         hostId === "00000000-0000-0000-0000-000000000001";
};

// Convert local moment to database insert format
const localMomentToDbInsert = (local: Omit<MomentLocal, "id" | "created_at">): MomentInsert => ({
  host_id: isDevHostId(local.host_id) ? null : local.host_id,
  host_name: local.host_name,
  starts_at: local.starts_at,
  duration: local.duration,
  expires_at: local.expires_at,
  lat: local.location.lat,
  lng: local.location.lng,
  place_name: local.location.place_name || null,
  area_name: local.location.area_name || null,
  seats_total: local.seats_total,
  seats_taken: local.seats_taken,
  note: local.note || null,
  status: local.status,
});

interface MomentState {
  moments: MomentLocal[];
  loading: boolean;
  error: string | null;
  subscription: RealtimeChannel | null;

  // Local state management
  setMoments: (moments: MomentLocal[]) => void;
  addMoment: (moment: MomentLocal) => void;
  updateMoment: (id: string, updates: Partial<MomentLocal>) => void;
  removeMoment: (id: string) => void;
  clearMoments: () => void;

  // Supabase operations
  fetchNearbyMoments: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  createMomentInDb: (data: Omit<MomentLocal, "id" | "created_at">) => Promise<MomentLocal | null>;
  cancelMomentInDb: (id: string) => Promise<boolean>;
  joinMoment: (momentId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  leaveMoment: (momentId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  subscribeToMoments: () => () => void;
}

export const useMomentStore = create<MomentState>((set, get) => ({
  moments: [],
  loading: false,
  error: null,
  subscription: null,

  // Local state management
  setMoments: (moments) => set({ moments }),
  addMoment: (moment) =>
    set((state) => ({ moments: [...state.moments, moment] })),
  updateMoment: (id, updates) =>
    set((state) => ({
      moments: state.moments.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  removeMoment: (id) =>
    set((state) => ({ moments: state.moments.filter((m) => m.id !== id) })),
  clearMoments: () => set({ moments: [] }),

  // Fetch nearby moments from Supabase
  fetchNearbyMoments: async (lat: number, lng: number, radiusKm = 5) => {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, skipping fetch");
      return;
    }

    set({ loading: true, error: null });

    try {
      // Try the nearby_moments function first, fall back to direct query
      const { data, error } = await db
        .from("moments")
        .select("*")
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .order("starts_at", { ascending: true });

      if (error) throw error;

      const localMoments = ((data as Moment[]) || []).map(dbMomentToLocal);
      set({ moments: localMoments, loading: false });
    } catch (err) {
      console.error("Error fetching moments:", err);
      set({ error: (err as Error).message, loading: false });
    }
  },

  // Create a moment in Supabase
  createMomentInDb: async (data) => {
    // In DEV_MODE or when Supabase isn't configured, create local moment only
    if (DEV_MODE || !isSupabaseConfigured()) {
      console.log("[DEV MODE] Creating local moment only");
      const localMoment: MomentLocal = {
        ...data,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      get().addMoment(localMoment);
      return localMoment;
    }

    set({ loading: true, error: null });

    try {
      const insertData: MomentInsert = localMomentToDbInsert(data);

      const { data: createdMoment, error } = await db
        .from("moments")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      if (!createdMoment) throw new Error("No moment returned");

      const localMoment = dbMomentToLocal(createdMoment as Moment);
      get().addMoment(localMoment);
      set({ loading: false });
      return localMoment;
    } catch (err) {
      console.error("Error creating moment:", err);
      set({ error: (err as Error).message, loading: false });
      return null;
    }
  },

  // Cancel a moment in Supabase
  cancelMomentInDb: async (id: string) => {
    if (!isSupabaseConfigured()) {
      get().removeMoment(id);
      return true;
    }

    try {
      const { error } = await db
        .from("moments")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      get().removeMoment(id);
      return true;
    } catch (err) {
      console.error("Error cancelling moment:", err);
      return false;
    }
  },

  // Join a moment - create connection and increment seats_taken
  joinMoment: async (momentId: string, userId: string) => {
    // In DEV_MODE, just update local state
    if (DEV_MODE || !isSupabaseConfigured()) {
      console.log("[DEV MODE] Joining moment locally");
      const moment = get().moments.find((m) => m.id === momentId);
      if (moment) {
        const newSeatsTaken = moment.seats_taken + 1;
        const newStatus = newSeatsTaken >= moment.seats_total ? "full" : "active";
        get().updateMoment(momentId, {
          seats_taken: newSeatsTaken,
          status: newStatus as "active" | "full" | "completed" | "cancelled"
        });
      }
      return { success: true };
    }

    set({ loading: true, error: null });

    try {
      // Check if moment exists and has available seats
      const moment = get().moments.find((m) => m.id === momentId);
      if (!moment) {
        throw new Error("Moment not found");
      }
      if (moment.seats_taken >= moment.seats_total) {
        throw new Error("This moment is full");
      }
      if (moment.host_id === userId) {
        throw new Error("You can't join your own moment");
      }

      // Create connection
      const { error: connectionError } = await db
        .from("connections")
        .insert({
          moment_id: momentId,
          user_id: userId,
          status: "confirmed",
        });

      if (connectionError) {
        // Check if it's a duplicate
        if (connectionError.code === "23505") {
          throw new Error("You've already joined this moment");
        }
        throw connectionError;
      }

      // Increment seats_taken
      const newSeatsTaken = moment.seats_taken + 1;
      const newStatus = newSeatsTaken >= moment.seats_total ? "full" : "active";

      const { error: updateError } = await db
        .from("moments")
        .update({
          seats_taken: newSeatsTaken,
          status: newStatus
        })
        .eq("id", momentId);

      if (updateError) throw updateError;

      // Update local state
      get().updateMoment(momentId, {
        seats_taken: newSeatsTaken,
        status: newStatus as "active" | "full" | "completed" | "cancelled"
      });

      set({ loading: false });
      return { success: true };
    } catch (err) {
      console.error("Error joining moment:", err);
      set({ error: (err as Error).message, loading: false });
      return { success: false, error: (err as Error).message };
    }
  },

  // Leave a moment - cancel connection and decrement seats_taken
  leaveMoment: async (momentId: string, userId: string) => {
    // In DEV_MODE, just update local state
    if (DEV_MODE || !isSupabaseConfigured()) {
      console.log("[DEV MODE] Leaving moment locally");
      const moment = get().moments.find((m) => m.id === momentId);
      if (moment && moment.seats_taken > 0) {
        get().updateMoment(momentId, {
          seats_taken: moment.seats_taken - 1,
          status: "active"
        });
      }
      return { success: true };
    }

    set({ loading: true, error: null });

    try {
      // Update connection status to cancelled
      const { error: connectionError } = await db
        .from("connections")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString()
        })
        .eq("moment_id", momentId)
        .eq("user_id", userId);

      if (connectionError) throw connectionError;

      // Decrement seats_taken
      const moment = get().moments.find((m) => m.id === momentId);
      if (moment && moment.seats_taken > 0) {
        const newSeatsTaken = moment.seats_taken - 1;

        const { error: updateError } = await db
          .from("moments")
          .update({
            seats_taken: newSeatsTaken,
            status: "active" // Reopen if was full
          })
          .eq("id", momentId);

        if (updateError) throw updateError;

        // Update local state
        get().updateMoment(momentId, {
          seats_taken: newSeatsTaken,
          status: "active"
        });
      }

      set({ loading: false });
      return { success: true };
    } catch (err) {
      console.error("Error leaving moment:", err);
      set({ error: (err as Error).message, loading: false });
      return { success: false, error: (err as Error).message };
    }
  },

  // Subscribe to real-time moment updates
  subscribeToMoments: () => {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, skipping subscription");
      return () => {};
    }

    // Unsubscribe from existing subscription if any
    const existingSub = get().subscription;
    if (existingSub) {
      existingSub.unsubscribe();
    }

    const channel = db
      .channel("moments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "moments",
        },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT") {
            const newMoment = dbMomentToLocal(newRecord as Moment);
            // Only add if active and not expired
            if (newMoment.status === "active" && new Date(newMoment.expires_at) > new Date()) {
              // Avoid duplicates
              const exists = get().moments.some((m) => m.id === newMoment.id);
              if (!exists) {
                get().addMoment(newMoment);
              }
            }
          } else if (eventType === "UPDATE") {
            const updatedMoment = newRecord as Moment;
            if (updatedMoment.status === "active") {
              get().updateMoment(updatedMoment.id, dbMomentToLocal(updatedMoment));
            } else {
              // Remove if no longer active
              get().removeMoment(updatedMoment.id);
            }
          } else if (eventType === "DELETE") {
            const deletedId = (oldRecord as Moment).id;
            get().removeMoment(deletedId);
          }
        }
      )
      .subscribe();

    set({ subscription: channel });

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      set({ subscription: null });
    };
  },
}));
