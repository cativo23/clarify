import { requireAdmin } from "../../../utils/auth";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Request body schema
const updateSchema = z.object({
  action: z.enum(["add_credits", "remove_credits", "suspend", "unsuspend"]),
  amount: z.number().positive().optional(),
  reason: z.string().min(1, "Reason is required"),
});

type UpdateRequest = z.infer<typeof updateSchema>;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const userId = getRouterParam(event, "id");
  if (!userId) {
    throw createError({ statusCode: 400, message: "Missing user id" });
  }

  // Parse request body
  let body: UpdateRequest;
  try {
    const rawBody = await readBody(event);
    body = updateSchema.parse(rawBody);
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.errors?.[0]?.message || "Invalid request body",
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw createError({
      statusCode: 500,
      message: "Missing Supabase configuration",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle each action type
  switch (body.action) {
    case "add_credits":
    case "remove_credits": {
      if (!body.amount) {
        throw createError({
          statusCode: 400,
          message: "Amount is required for credit adjustments",
        });
      }

      // Get current credits
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("credits, email")
        .eq("id", userId)
        .single();

      if (fetchError) {
        throw createError({
          statusCode: 404,
          message: `User not found: ${fetchError.message}`,
        });
      }

      const currentCredits = userData.credits || 0;
      const adjustment = body.action === "add_credits" ? body.amount : -body.amount;
      const newCredits = Math.max(0, currentCredits + adjustment);

      // Update credits
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        throw createError({
          statusCode: 500,
          message: `Failed to update credits: ${updateError.message}`,
        });
      }

      // Create audit trail in transactions table
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: userId,
        credits_purchased: 0,
        amount: 0,
        status: "completed",
        type: "adjustment",
        description: `${body.action === "add_credits" ? "Added" : "Removed"} ${body.amount} credits: ${body.reason}`,
        created_at: new Date().toISOString(),
      });

      if (transactionError) {
        console.error("Failed to create transaction audit record:", transactionError.message);
        // Don't fail the request, but log it
      }

      return {
        success: true,
        user: updatedUser,
        action: body.action,
        amount: body.amount,
        previous_credits: currentCredits,
        new_credits: newCredits,
      };
    }

    case "suspend": {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          is_suspended: true,
          suspension_reason: body.reason,
          suspended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        throw createError({
          statusCode: 500,
          message: `Failed to suspend user: ${updateError.message}`,
        });
      }

      return {
        success: true,
        user: updatedUser,
        action: "suspend",
        reason: body.reason,
      };
    }

    case "unsuspend": {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        throw createError({
          statusCode: 500,
          message: `Failed to unsuspend user: ${updateError.message}`,
        });
      }

      return {
        success: true,
        user: updatedUser,
        action: "unsuspend",
      };
    }

    default:
      throw createError({ statusCode: 400, message: "Invalid action" });
  }
});
