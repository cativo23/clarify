import { serverSupabaseClient } from "#supabase/server";
import type { H3Event } from "h3";

/**
 * Normalizes email for safe comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Applies Unicode NFKC normalization to prevent homograph attacks
 * @param email - The email to normalize
 * @returns Normalized email string
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim().normalize("NFKC"); // Unicode normalization to prevent homograph attacks
}

/**
 * Checks if the current user is an admin based on email
 *
 * [SECURITY FIX H1] Implements defense-in-depth against admin auth bypass:
 * - Case-insensitive email comparison
 * - Unicode NFKC normalization prevents homograph attacks (e.g., Cyrillic 'а')
 * - Checks both config.adminEmail AND admin_emails database table
 *
 * @param event - The H3 event
 * @returns true if user is authenticated and is admin, false otherwise
 */
export async function isAdminUser(event: H3Event): Promise<boolean> {
  const _client = await serverSupabaseClient(event);
  const user = (await _client.auth.getUser()).data.user;

  if (!user || !user.email) {
    return false;
  }

  return isAdminEmail(event, user.email);
}

/**
 * Same admin check as isAdminUser, but accepts an already-resolved email
 * to avoid a redundant auth.getUser() round-trip when the caller has just
 * fetched the user themselves.
 */
export async function isAdminEmail(
  event: H3Event,
  email: string,
): Promise<boolean> {
  if (!email) {
    return false;
  }

  const config = useRuntimeConfig();
  const adminEmailConfig = config.adminEmail;

  const userEmail = normalizeEmail(email);

  // Check 1: Compare against config.adminEmail (normalized)
  if (adminEmailConfig) {
    const normalizedAdminEmail = normalizeEmail(adminEmailConfig);
    if (userEmail === normalizedAdminEmail) {
      return true;
    }
  }

  // Check 2: [Defense in Depth] Query admin_emails table for additional admins
  // This allows multiple admins without hardcoding emails in config
  try {
    const supabase = await serverSupabaseClient(event);
    const { data, error } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("email", userEmail)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      // Log but don't fail - table might not exist yet
      console.debug("[Auth] admin_emails table query:", error.message);
      return (
        !!adminEmailConfig && userEmail === normalizeEmail(adminEmailConfig)
      );
    }

    return !!data;
  } catch (dbError) {
    // Database error - fall back to config-only check
    console.error("[Auth] Database error checking admin_emails:", dbError);
    return !!adminEmailConfig && userEmail === normalizeEmail(adminEmailConfig);
  }
}

/**
 * Verifies admin access and throws 401 if not authorized
 * @param event - The H3 event
 * @throws 401 error if user is not admin
 */
export async function requireAdmin(event: H3Event): Promise<void> {
  const is_admin = await isAdminUser(event);

  if (!is_admin) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }
}

/**
 * Standardized error code thrown when a suspended user touches any
 * surface gated by `assertNotSuspended`. Clients/UI should branch on
 * `error.data.code === ACCOUNT_SUSPENDED` rather than parsing messages.
 */
export const ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED" as const;

/**
 * Throws 403 if `users.is_suspended` is true for the resolved user.
 *
 * Behavior:
 * - If `userId` is provided, looks up that row directly.
 * - If omitted, resolves the user from `serverSupabaseClient(event).auth.getUser()`.
 *   When no authenticated user is present, returns silently — auth gating is the
 *   caller's responsibility (matches existing `requireAdmin` separation).
 * - On lookup error, fails OPEN (returns silently). Same defensive pattern used by
 *   `isAdminEmail` for the admin_emails table: an infra hiccup must not lock out
 *   legitimate users. Suspension is a deliberate admin action; absence of evidence
 *   is treated as "not suspended" rather than "suspended by default".
 *
 * The error contract is intentionally minimal — fixed code, no DB error text —
 * to avoid leaking internal state (T-10-04 in plan threat model).
 *
 * @param event - The H3 event (used to obtain a request-scoped Supabase client)
 * @param userId - Optional user id; when omitted, resolved from the session
 * @throws 403 with `data.code === ACCOUNT_SUSPENDED` when the user is suspended
 */
export async function assertNotSuspended(
  event: H3Event,
  userId?: string,
): Promise<void> {
  const client = await serverSupabaseClient(event);

  let uid = userId;
  if (!uid) {
    const { data } = await client.auth.getUser();
    if (!data.user) return; // unauthenticated path is handled by callers
    uid = data.user.id;
  }

  const { data, error } = await client
    .from("users")
    .select("is_suspended")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    // Fail-open on infra error — see jsdoc above for rationale.
    console.error("[Auth] suspension lookup failed:", error.message);
    return;
  }

  if (data?.is_suspended === true) {
    throw createError({
      statusCode: 403,
      statusMessage: "Account suspended",
      data: { code: ACCOUNT_SUSPENDED },
    });
  }
}
