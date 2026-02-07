// Generated TypeScript types for Supabase database
// These types mirror the database schema defined in supabase/migrations/

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          first_name: string;
          phone_verified: boolean;
          verified_at: string | null;
          meals_hosted: number;
          meals_joined: number;
          no_shows: number;
          push_token: string | null;
          status: "active" | "limited" | "banned";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          first_name: string;
          phone_verified?: boolean;
          verified_at?: string | null;
          meals_hosted?: number;
          meals_joined?: number;
          no_shows?: number;
          push_token?: string | null;
          status?: "active" | "limited" | "banned";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          first_name?: string;
          phone_verified?: boolean;
          verified_at?: string | null;
          meals_hosted?: number;
          meals_joined?: number;
          no_shows?: number;
          push_token?: string | null;
          status?: "active" | "limited" | "banned";
          created_at?: string;
          updated_at?: string;
        };
      };
      moments: {
        Row: {
          id: string;
          host_id: string | null;
          host_name: string;
          starts_at: string;
          duration: "quick" | "normal" | "long";
          expires_at: string;
          lat: number;
          lng: number;
          place_name: string | null;
          area_name: string | null;
          seats_total: number;
          seats_taken: number;
          note: string | null;
          status: "active" | "full" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id?: string | null;
          host_name: string;
          starts_at: string;
          duration: "quick" | "normal" | "long";
          expires_at: string;
          lat: number;
          lng: number;
          place_name?: string | null;
          area_name?: string | null;
          seats_total?: number;
          seats_taken?: number;
          note?: string | null;
          status?: "active" | "full" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string | null;
          host_name?: string;
          starts_at?: string;
          duration?: "quick" | "normal" | "long";
          expires_at?: string;
          lat?: number;
          lng?: number;
          place_name?: string | null;
          area_name?: string | null;
          seats_total?: number;
          seats_taken?: number;
          note?: string | null;
          status?: "active" | "full" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
      };
      connections: {
        Row: {
          id: string;
          moment_id: string;
          user_id: string;
          status: "confirmed" | "cancelled" | "no_show" | "completed" | "arrived";
          joined_at: string;
          arrived_at: string | null;
          cancelled_at: string | null;
          running_late: boolean;
          running_late_at: string | null;
        };
        Insert: {
          id?: string;
          moment_id: string;
          user_id: string;
          status?: "confirmed" | "cancelled" | "no_show" | "completed" | "arrived";
          joined_at?: string;
          arrived_at?: string | null;
          cancelled_at?: string | null;
          running_late?: boolean;
          running_late_at?: string | null;
        };
        Update: {
          id?: string;
          moment_id?: string;
          user_id?: string;
          status?: "confirmed" | "cancelled" | "no_show" | "completed" | "arrived";
          joined_at?: string;
          arrived_at?: string | null;
          cancelled_at?: string | null;
          running_late?: boolean;
          running_late_at?: string | null;
        };
      };
      relationships: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a?: string;
          user_b?: string;
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          moment_id: string;
          from_user: string;
          about_user: string;
          rating: "great" | "okay" | "nope";
          note: string | null;
          eat_again: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          moment_id: string;
          from_user: string;
          about_user: string;
          rating: "great" | "okay" | "nope";
          note?: string | null;
          eat_again?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          moment_id?: string;
          from_user?: string;
          about_user?: string;
          rating?: "great" | "okay" | "nope";
          note?: string | null;
          eat_again?: boolean | null;
          created_at?: string;
        };
      };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      eat_again_matches: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          moment_id: string;
          matched_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          moment_id: string;
          matched_at?: string;
        };
        Update: {
          id?: string;
          user_a_id?: string;
          user_b_id?: string;
          moment_id?: string;
          matched_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string;
          moment_id: string | null;
          category: "no_show" | "inappropriate_behavior" | "harassment" | "fake_profile" | "safety_concern" | "other";
          description: string | null;
          status: "pending" | "reviewing" | "resolved" | "dismissed";
          reviewed_at: string | null;
          reviewed_by: string | null;
          admin_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id: string;
          moment_id?: string | null;
          category: "no_show" | "inappropriate_behavior" | "harassment" | "fake_profile" | "safety_concern" | "other";
          description?: string | null;
          status?: "pending" | "reviewing" | "resolved" | "dismissed";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          admin_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_user_id?: string;
          moment_id?: string | null;
          category?: "no_show" | "inappropriate_behavior" | "harassment" | "fake_profile" | "safety_concern" | "other";
          description?: string | null;
          status?: "pending" | "reviewing" | "resolved" | "dismissed";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          admin_notes?: string | null;
          created_at?: string;
        };
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      nearby_moments: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_km?: number;
        };
        Returns: Database["public"]["Tables"]["moments"]["Row"][];
      };
      expire_moments: {
        Args: Record<string, never>;
        Returns: number;
      };
      join_moment: {
        Args: {
          p_moment_id: string;
          p_user_id: string;
        };
        Returns: Database["public"]["Tables"]["connections"]["Row"];
      };
      leave_moment: {
        Args: {
          p_moment_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      maybe_create_relationship: {
        Args: {
          p_moment_id: string;
          p_from_user: string;
          p_about_user: string;
          p_eat_again: boolean;
        };
        Returns: Database["public"]["Tables"]["relationships"]["Row"] | null;
      };
      get_user_connections: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          user_id: string;
          first_name: string;
          phone_verified: boolean;
          meals_hosted: number;
          meals_joined: number;
        }[];
      };
      increment_user_stats: {
        Args: {
          p_moment_id: string;
        };
        Returns: void;
      };
    };
  };
}

// Convenience type aliases
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Moment = Database["public"]["Tables"]["moments"]["Row"];
export type MomentInsert = Database["public"]["Tables"]["moments"]["Insert"];
export type MomentUpdate = Database["public"]["Tables"]["moments"]["Update"];

export type Connection = Database["public"]["Tables"]["connections"]["Row"];
export type ConnectionInsert = Database["public"]["Tables"]["connections"]["Insert"];
export type ConnectionUpdate = Database["public"]["Tables"]["connections"]["Update"];

export type Relationship = Database["public"]["Tables"]["relationships"]["Row"];
export type RelationshipInsert = Database["public"]["Tables"]["relationships"]["Insert"];

export type Feedback = Database["public"]["Tables"]["feedback"]["Row"];
export type FeedbackInsert = Database["public"]["Tables"]["feedback"]["Insert"];

export type BlockedUser = Database["public"]["Tables"]["blocked_users"]["Row"];
export type BlockedUserInsert = Database["public"]["Tables"]["blocked_users"]["Insert"];

export type EatAgainMatch = Database["public"]["Tables"]["eat_again_matches"]["Row"];

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
export type ReportUpdate = Database["public"]["Tables"]["reports"]["Update"];

export type Block = Database["public"]["Tables"]["blocks"]["Row"];
export type BlockInsert = Database["public"]["Tables"]["blocks"]["Insert"];
export type BlockUpdate = Database["public"]["Tables"]["blocks"]["Update"];
export type EatAgainMatchInsert = Database["public"]["Tables"]["eat_again_matches"]["Insert"];
