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

// User's connection to a moment
interface UserConnection {
  momentId: string;
  status: "confirmed" | "cancelled" | "no_show" | "completed";
  joinedAt: string;
}

// Guest info for a moment (from host's perspective)
export interface MomentGuest {
  id: string;
  userId: string;
  firstName: string;
  joinedAt: string;
  status: "confirmed" | "cancelled" | "no_show" | "completed";
}

// Callback type for guest events
type GuestEventCallback = (event: "joined" | "cancelled", guest: MomentGuest) => void;

interface MomentState {
  moments: MomentLocal[];
  userConnections: UserConnection[];
  momentGuests: Map<string, MomentGuest[]>; // momentId -> guests
  connectionSubscription: RealtimeChannel | null;
  loading: boolean;
  error: string | null;
  subscription: RealtimeChannel | null;

  // Local state management
  setMoments: (moments: MomentLocal[]) => void;
  addMoment: (moment: MomentLocal) => void;
  updateMoment: (id: string, updates: Partial<MomentLocal>) => void;
  removeMoment: (id: string) => void;
  clearMoments: () => void;

  // User connections
  fetchUserConnections: (userId: string) => Promise<void>;
  hasJoinedMoment: (momentId: string) => boolean;
  clearUserConnections: () => void;

  // Supabase operations
  fetchNearbyMoments: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  createMomentInDb: (data: Omit<MomentLocal, "id" | "created_at">) => Promise<MomentLocal | null>;
  cancelMomentInDb: (id: string) => Promise<boolean>;
  joinMoment: (momentId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  leaveMoment: (momentId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  subscribeToMoments: () => () => void;

  // Host guest management
  fetchMomentGuests: (momentId: string) => Promise<MomentGuest[]>;
  getMomentGuests: (momentId: string) => MomentGuest[];
  subscribeToMomentConnections: (momentId: string, onGuestEvent?: GuestEventCallback) => () => void;
}

export const useMomentStore = create<MomentState>((set, get) => ({
  moments: [],
  userConnections: [],
  momentGuests: new Map(),
  connectionSubscription: null,
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

  // User connections
  fetchUserConnections: async (userId: string) => {
    if (DEV_MODE || !isSupabaseConfigured()) {
      console.log("[DEV MODE] Skipping user connections fetch");
      return;
    }

    try {
      const { data, error } = await db
        .from("connections")
        .select("moment_id, status, joined_at")
        .eq("user_id", userId)
        .in("status", ["confirmed", "completed"]); // Only active connections

      if (error) throw error;

      const connections: UserConnection[] = (data || []).map((c: any) => ({
        momentId: c.moment_id,
        status: c.status,
        joinedAt: c.joined_at,
      }));

      set({ userConnections: connections });
    } catch (err) {
      console.error("Error fetching user connections:", err);
    }
  },

  hasJoinedMoment: (momentId: string) => {
    return get().userConnections.some(
      (c) => c.momentId === momentId && (c.status === "confirmed" || c.status === "completed")
    );
  },

  clearUserConnections: () => set({ userConnections: [] }),

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
        // Add to user connections in dev mode
        set((state) => ({
          userConnections: [
            ...state.userConnections,
            { momentId, status: "confirmed", joinedAt: new Date().toISOString() }
          ]
        }));
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

      // Add to user connections
      set((state) => ({
        userConnections: [
          ...state.userConnections,
          { momentId, status: "confirmed", joinedAt: new Date().toISOString() }
        ],
        loading: false
      }));

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
        // Remove from user connections in dev mode
        set((state) => ({
          userConnections: state.userConnections.filter((c) => c.momentId !== momentId)
        }));
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

      // Remove from user connections
      set((state) => ({
        userConnections: state.userConnections.filter((c) => c.momentId !== momentId),
        loading: false
      }));

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

  // Fetch guests for a specific moment (for hosts)
  fetchMomentGuests: async (momentId: string) => {
    // In DEV_MODE, return mock data
    if (DEV_MODE || !isSupabaseConfigured()) {
      console.log("[DEV MODE] Returning mock guests");
      const mockGuests: MomentGuest[] = [];
      const moment = get().moments.find((m) => m.id === momentId);
      if (moment && moment.seats_taken > 0) {
        // Create mock guests based on seats_taken
        for (let i = 0; i < moment.seats_taken; i++) {
          mockGuests.push({
            id: `mock-connection-${i}`,
            userId: `mock-user-${i}`,
            firstName: `Guest ${i + 1}`,
            joinedAt: new Date().toISOString(),
            status: "confirmed",
          });
        }
      }
      set((state) => {
        const newMap = new Map(state.momentGuests);
        newMap.set(momentId, mockGuests);
        return { momentGuests: newMap };
      });
      return mockGuests;
    }

    try {
      // Fetch connections with user info
      const { data, error } = await db
        .from("connections")
        .select(`
          id,
          user_id,
          joined_at,
          status,
          users!connections_user_id_fkey (
            first_name
          )
        `)
        .eq("moment_id", momentId)
        .eq("status", "confirmed");

      if (error) throw error;

      const guests: MomentGuest[] = (data || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        firstName: c.users?.first_name || "Guest",
        joinedAt: c.joined_at,
        status: c.status,
      }));

      set((state) => {
        const newMap = new Map(state.momentGuests);
        newMap.set(momentId, guests);
        return { momentGuests: newMap };
      });

      return guests;
    } catch (err) {
      console.error("Error fetching moment guests:", err);
      return [];
    }
  },

  // Get cached guests for a moment
  getMomentGuests: (momentId: string) => {
    return get().momentGuests.get(momentId) || [];
  },

  // Subscribe to real-time connection updates for a moment
  subscribeToMomentConnections: (momentId: string, onGuestEvent?: GuestEventCallback) => {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, skipping connection subscription");
      return () => {};
    }

    // Unsubscribe from existing connection subscription if any
    const existingSub = get().connectionSubscription;
    if (existingSub) {
      existingSub.unsubscribe();
    }

    const channel = db
      .channel(`connections-${momentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections",
          filter: `moment_id=eq.${momentId}`,
        },
        async (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT" && newRecord.status === "confirmed") {
            // New guest joined - fetch their info
            const { data: userData } = await db
              .from("users")
              .select("first_name")
              .eq("id", newRecord.user_id)
              .single();

            const newGuest: MomentGuest = {
              id: newRecord.id,
              userId: newRecord.user_id,
              firstName: userData?.first_name || "Guest",
              joinedAt: newRecord.joined_at,
              status: "confirmed",
            };

            // Update local guests list
            set((state) => {
              const newMap = new Map(state.momentGuests);
              const currentGuests = newMap.get(momentId) || [];
              // Avoid duplicates
              if (!currentGuests.some((g) => g.id === newGuest.id)) {
                newMap.set(momentId, [...currentGuests, newGuest]);
              }
              return { momentGuests: newMap };
            });

            // Notify callback
            if (onGuestEvent) {
              onGuestEvent("joined", newGuest);
            }
          } else if (eventType === "UPDATE" && newRecord.status === "cancelled") {
            // Guest cancelled
            const cancelledGuest = get().momentGuests.get(momentId)?.find(
              (g) => g.userId === newRecord.user_id
            );

            // Remove from local guests list
            set((state) => {
              const newMap = new Map(state.momentGuests);
              const currentGuests = newMap.get(momentId) || [];
              newMap.set(
                momentId,
                currentGuests.filter((g) => g.userId !== newRecord.user_id)
              );
              return { momentGuests: newMap };
            });

            // Notify callback
            if (onGuestEvent && cancelledGuest) {
              onGuestEvent("cancelled", { ...cancelledGuest, status: "cancelled" });
            }
          }
        }
      )
      .subscribe();

    set({ connectionSubscription: channel });

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      set({ connectionSubscription: null });
    };
  },
}));
