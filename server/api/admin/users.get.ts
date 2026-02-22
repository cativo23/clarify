import { requireAdmin } from "../../utils/auth";
import { getAdminSupabaseClient } from "../../utils/admin-supabase";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const admin = getAdminSupabaseClient();

  const result = await admin.getUsersSummary();

  if (result.error) {
    throw createError({ statusCode: 500, message: result.error });
  }

  return { users: result.data || [] };
});
