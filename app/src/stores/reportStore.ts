import { create } from "zustand";
import { supabase } from "../config/supabase";
import type { Report, ReportInsert } from "../types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// Type-safe Supabase client helper
const db = supabase as SupabaseClient<any>;

interface ReportState {
  reports: Report[];
  loading: boolean;
  error: string | null;

  // Submit a new report
  submitReport: (data: Omit<ReportInsert, "id" | "created_at" | "status">) => Promise<Report | null>;

  // Fetch user's submitted reports (to see status)
  fetchUserReports: (userId: string) => Promise<void>;

  // Clear reports
  clearReports: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  loading: false,
  error: null,

  submitReport: async (data) => {
    set({ loading: true, error: null });

    try {
      const reportData: ReportInsert = {
        ...data,
        status: "pending",
      };

      const { data: report, error } = await db
        .from("reports")
        .insert(reportData)
        .select()
        .single();

      if (error) {
        console.error("Error submitting report:", error);
        set({ error: error.message, loading: false });
        return null;
      }

      console.log("✅ Report submitted:", report.id);

      // Add to local state
      set((state) => ({
        reports: [...state.reports, report],
        loading: false,
      }));

      return report;
    } catch (error: any) {
      console.error("Error submitting report:", error);
      set({ error: error.message || "Failed to submit report", loading: false });
      return null;
    }
  },

  fetchUserReports: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await db
        .from("reports")
        .select("*")
        .eq("reporter_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        set({ error: error.message, loading: false });
        return;
      }

      set({ reports: data || [], loading: false });
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      set({ error: error.message || "Failed to fetch reports", loading: false });
    }
  },

  clearReports: () => {
    set({ reports: [], error: null });
  },
}));
