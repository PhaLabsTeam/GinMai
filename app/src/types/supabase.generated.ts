// Generated from the live database by supabase gen types (see docs/backend/README.md).
// Do not edit; schema.test.ts checks src/types/database.ts against it.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          arrived_at: string | null
          cancelled_at: string | null
          id: string
          joined_at: string
          moment_id: string
          running_late: boolean | null
          running_late_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          arrived_at?: string | null
          cancelled_at?: string | null
          id?: string
          joined_at?: string
          moment_id: string
          running_late?: boolean | null
          running_late_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          arrived_at?: string | null
          cancelled_at?: string | null
          id?: string
          joined_at?: string
          moment_id?: string
          running_late?: boolean | null
          running_late_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      eat_again_matches: {
        Row: {
          id: string
          matched_at: string
          moment_id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          id?: string
          matched_at?: string
          moment_id: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          id?: string
          matched_at?: string
          moment_id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eat_again_matches_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eat_again_matches_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eat_again_matches_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          about_user: string
          created_at: string
          eat_again: boolean | null
          from_user: string
          id: string
          moment_id: string
          note: string | null
          rating: string
        }
        Insert: {
          about_user: string
          created_at?: string
          eat_again?: boolean | null
          from_user: string
          id?: string
          moment_id: string
          note?: string | null
          rating: string
        }
        Update: {
          about_user?: string
          created_at?: string
          eat_again?: boolean | null
          from_user?: string
          id?: string
          moment_id?: string
          note?: string | null
          rating?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_about_user_fkey"
            columns: ["about_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          area_name: string | null
          created_at: string
          duration: string
          expires_at: string
          host_id: string | null
          host_name: string
          id: string
          lat: number
          lng: number
          note: string | null
          place_name: string | null
          seats_taken: number
          seats_total: number
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          area_name?: string | null
          created_at?: string
          duration: string
          expires_at: string
          host_id?: string | null
          host_name: string
          id?: string
          lat: number
          lng: number
          note?: string | null
          place_name?: string | null
          seats_taken?: number
          seats_total?: number
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          area_name?: string | null
          created_at?: string
          duration?: string
          expires_at?: string
          host_id?: string | null
          host_name?: string
          id?: string
          lat?: number
          lng?: number
          note?: string | null
          place_name?: string | null
          seats_taken?: number
          seats_total?: number
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moments_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          moment_id: string | null
          reported_account_deleted_at: string | null
          reported_phone: string | null
          reported_user_id: string | null
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          moment_id?: string | null
          reported_account_deleted_at?: string | null
          reported_phone?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          moment_id?: string | null
          reported_account_deleted_at?: string | null
          reported_phone?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          first_name: string
          id: string
          meals_hosted: number
          meals_joined: number
          no_shows: number
          notify_joins: boolean
          notify_reminders: boolean
          phone: string
          phone_verified: boolean
          push_token: string | null
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          meals_hosted?: number
          meals_joined?: number
          no_shows?: number
          notify_joins?: boolean
          notify_reminders?: boolean
          phone: string
          phone_verified?: boolean
          push_token?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          meals_hosted?: number
          meals_joined?: number
          no_shows?: number
          notify_joins?: boolean
          notify_reminders?: boolean
          phone?: string
          phone_verified?: boolean
          push_token?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      at_table: {
        Args: { p_moment_id: string; p_user_id: string }
        Returns: boolean
      }
      complete_my_profile: {
        Args: { p_first_name: string }
        Returns: undefined
      }
      delete_my_account: { Args: never; Returns: undefined }
      expire_moments: { Args: never; Returns: number }
      my_blocked_user_ids: { Args: never; Returns: string[] }
      my_connections: {
        Args: never
        Returns: {
          first_name: string
          meals_hosted: number
          meals_joined: number
          phone_verified: boolean
          user_id: string
        }[]
      }
      my_moment_ids: { Args: never; Returns: string[] }
      my_profile: {
        Args: never
        Returns: {
          created_at: string
          first_name: string
          id: string
          meals_hosted: number
          meals_joined: number
          no_shows: number
          notify_joins: boolean
          notify_reminders: boolean
          phone: string
          phone_verified: boolean
          push_token: string | null
          status: string
          updated_at: string
          verified_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      my_table_mate_ids: { Args: never; Returns: string[] }
      purge_expired_reports: { Args: never; Returns: undefined }
      send_expo_push: {
        Args: {
          p_body: string
          p_data?: Json
          p_title: string
          p_tokens: string[]
        }
        Returns: undefined
      }
      sync_seats_taken: { Args: { p_moment_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
