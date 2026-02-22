import { serverSupabaseUser } from "#supabase/server";
import { createSafeRedirectUrl } from "../../utils/redirect-validation";

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const body = await readBody(event);
    const { packageId } = body;

    if (!packageId) {
      throw createError({
        statusCode: 400,
        message: "Missing required fields",
      });
    }

    // [SECURITY FIX C3] Construct safe redirect URLs server-side
    // This prevents open redirect/phishing attacks by controlling redirect destinations
    const successUrl = createSafeRedirectUrl("/dashboard", {
      payment: "success",
    });
    const cancelUrl = createSafeRedirectUrl("/credits", {
      payment: "cancelled",
    });

    const session = await createCheckoutSession(
      user.id,
      packageId,
      successUrl,
      cancelUrl,
    );

    return {
      success: true,
      data: {
        sessionId: session.id,
      },
    };
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create checkout session",
    });
  }
});
