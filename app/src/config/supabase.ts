import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database";

// DEV MODE: Set to true to bypass database operations entirely
// For M1 we want real database saves, so this is false
export const DEV_MODE = false;

// Supabase configuration
// Set these in your .env file:
// EXPO_PUBLIC_SUPABASE_URL=your_project_url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Create typed Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
};

// Re-export types for convenience
export type { Database } from "../types/database";
