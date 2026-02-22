import { serverSupabaseClient } from "#supabase/server";
import { requireAdmin } from "../../utils/auth";
import { getAdminSupabaseClient } from "../../utils/admin-supabase";
import { clearConfigCache } from "../../utils/config";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const _client = await serverSupabaseClient(event);
  const user = (await _client.auth.getUser()).data.user;
  const admin = getAdminSupabaseClient();
  const body = await readBody(event);

  // Validation (Basic) - expect new `tiers` shape
  if (
    !body ||
    !body.promptVersion ||
    !body.tiers ||
    !body.tiers.basic ||
    !body.tiers.premium ||
    !body.tiers.forensic
  ) {
    throw createError({
      statusCode: 400,
      message:
        "Invalid configuration object; expected promptVersion and tiers.{basic,premium,forensic}",
    });
  }

  const result = await admin.updateConfig("prompt_settings", body, user!.id);

  if (!result.success) {
    throw createError({
      statusCode: 500,
      message: result.error || "Failed to update configuration",
    });
  }

  clearConfigCache();

  return { success: true };
});
