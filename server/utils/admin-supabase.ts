/**
 * Admin-specific Supabase client with audit logging
 *
 * [SECURITY FIX C5] All service_role operations are logged for audit trail.
 * This provides visibility into admin operations and helps detect misuse.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface AdminSupabaseClient {
  /**
   * Fetch all users with analytics summary
   * Used by admin dashboard
   */
  getUsersSummary: () => Promise<{
    data?: any[];
    error?: string;
  }>;

  /**
   * Fetch single user with analyses
   */
  getUserWithAnalyses: (userId: string) => Promise<{
    profile?: any;
    analyses?: any[];
    error?: string;
  }>;

  /**
   * Fetch pricing tables
   */
  getPricingTables: () => Promise<{
    data?: any[];
    error?: string;
  }>;

  /**
   * Fetch configuration
   */
  getConfig: () => Promise<{
    data?: any;
    error?: string;
  }>;

  /**
   * Update configuration
   */
  updateConfig: (
    key: string,
    value: any,
    updatedBy: string,
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

let cachedClient: {
  supabase: SupabaseClient;
  wrapper: AdminSupabaseClient;
} | null = null;

/**
 * Creates an admin-scoped Supabase client with audit logging
 */
export function getAdminSupabaseClient(): AdminSupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("[Admin Supabase] Missing environment configuration");
  }

  if (cachedClient) {
    return cachedClient.wrapper;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const wrapper: AdminSupabaseClient = {
    async getUsersSummary() {
      const operation = "[Admin Supabase] getUsersSummary";
      console.log(`${operation} - Fetching users summary`);

      try {
        const { data, error } = await supabase
          .from("admin_users_summary")
          .select("*");

        if (error) {
          console.error(`${operation} - Error:`, error.message);
          return { error: error.message };
        }

        console.log(`${operation} - Found ${data?.length || 0} users`);
        return { data: data || [] };
      } catch (err: any) {
        console.error(`${operation} - Error:`, err.message);
        return { error: err.message };
      }
    },

    async getUserWithAnalyses(userId) {
      const operation = `[Admin Supabase] getUserWithAnalyses(${userId})`;
      console.log(operation);

      try {
        // Fetch profile
        const { data: profile, error: pErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (pErr) {
          console.error(`${operation} - Profile error:`, pErr.message);
          return { error: pErr.message };
        }

        // Fetch analyses
        const { data: analyses, error: aErr } = await supabase
          .from("analyses")
          .select("id, status, risk_level, created_at, summary_json")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (aErr) {
          console.error(`${operation} - Analyses error:`, aErr.message);
          return { error: aErr.message };
        }

        console.log(`${operation} - Found ${analyses?.length || 0} analyses`);
        return { profile, analyses: analyses || [] };
      } catch (err: any) {
        console.error(`${operation} - Error:`, err.message);
        return { error: err.message };
      }
    },

    async getPricingTables() {
      const operation = "[Admin Supabase] getPricingTables";
      console.log(operation);

      try {
        const { data, error } = await supabase
          .from("pricing_tables")
          .select("*");

        if (error) {
          console.error(`${operation} - Error:`, error.message);
          return { error: error.message };
        }

        console.log(`${operation} - Found ${data?.length || 0} pricing rows`);
        return { data: data || [] };
      } catch (err: any) {
        console.error(`${operation} - Error:`, err.message);
        return { error: err.message };
      }
    },

    async getConfig() {
      const operation = "[Admin Supabase] getConfig";
      console.log(operation);

      try {
        const { data, error } = await supabase
          .from("configurations")
          .select("value")
          .eq("key", "prompt_settings")
          .single();

        if (error) {
          console.error(`${operation} - Error:`, error.message);
          return { error: error.message };
        }

        return { data: data?.value || null };
      } catch (err: any) {
        console.error(`${operation} - Error:`, err.message);
        return { error: err.message };
      }
    },

    async updateConfig(key, value, updatedBy) {
      const operation = `[Admin Supabase] updateConfig by ${updatedBy}`;
      console.log(operation, { key });

      try {
        const { error } = await supabase.from("configurations").upsert(
          {
            key,
            value,
            updated_by: updatedBy,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );

        if (error) {
          console.error(`${operation} - Error:`, error.message);
          return { success: false, error: error.message };
        }

        console.log(`${operation} - Success`);
        return { success: true };
      } catch (err: any) {
        console.error(`${operation} - Error:`, err.message);
        return { success: false, error: err.message };
      }
    },
  };

  cachedClient = { supabase, wrapper };
  return wrapper;
}

/**
 * Clear cached client (useful for testing or config reload)
 */
export function clearAdminSupabaseCache() {
  cachedClient = null;
}
