// Re-export database types
export * from "./database";

// App-specific types (for local state before Supabase is connected)
// These mirror the database types but with nested location for convenience

export interface MomentLocal {
  id: string;
  host_id: string;
  host_name: string;

  // When
  starts_at: string; // ISO DateTime
  duration: "quick" | "normal" | "long"; // 30min, 1hr, 2hr+

  // Where (nested for convenience in app)
  location: {
    lat: number;
    lng: number;
    place_name?: string;
    area_name?: string;
  };

  // What
  seats_total: number; // 1-4
  seats_taken: number; // 0 to seats_total
  note?: string;

  // State
  status: "active" | "full" | "completed" | "cancelled";
  created_at: string;
  expires_at: string;
}

export interface UserLocal {
  id: string;
  phone: string;
  first_name: string;
  verified: boolean;
  created_at: string;

  // Earned over time
  meals_hosted: number;
  meals_joined: number;
  no_shows: number;
}
