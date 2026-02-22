import { URL } from "url";

/**
 * Validates redirect URLs to prevent open redirect/phishing attacks.
 * Only allows redirects to configured application domains.
 *
 * @param redirectUrl - The URL to validate
 * @param allowedOrigins - List of allowed origin domains
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateRedirectUrl(
  redirectUrl: string,
  allowedOrigins: string[],
): { isValid: boolean; error?: string; sanitizedUrl?: string } {
  // 1. Basic validation
  if (!redirectUrl || typeof redirectUrl !== "string") {
    return { isValid: false, error: "Invalid or missing redirect URL" };
  }

  if (!allowedOrigins || allowedOrigins.length === 0) {
    return {
      isValid: false,
      error: "Server configuration error: No allowed origins configured",
    };
  }

  // 2. Parse the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(redirectUrl);
  } catch {
    return { isValid: false, error: "Invalid URL format" };
  }

  // 3. Ensure HTTPS only (prevent http:// and other protocols)
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return {
      isValid: false,
      error: "Only HTTP/HTTPS URLs are allowed",
    };
  }

  // 4. For production, enforce HTTPS only
  if (
    process.env.NODE_ENV === "production" &&
    parsedUrl.protocol !== "https:"
  ) {
    return {
      isValid: false,
      error: "Only HTTPS URLs are allowed in production",
    };
  }

  // 5. Check if the origin is in the allowed list
  const origin = parsedUrl.origin;
  const isAllowed = allowedOrigins.some((allowed) => {
    // Exact match
    if (origin === allowed) {
      return true;
    }

    // Allow subdomain wildcards (e.g., *.example.com)
    if (allowed.startsWith("*.")) {
      const baseDomain = allowed.slice(2);
      return origin.endsWith(`.${baseDomain}`) || origin === baseDomain;
    }

    return false;
  });

  if (!isAllowed) {
    return {
      isValid: false,
      error: `Redirect URL origin '${origin}' is not in the allowed list`,
    };
  }

  // 6. Security: Prevent path traversal in the URL path
  if (parsedUrl.pathname.includes("..")) {
    return {
      isValid: false,
      error: "Invalid URL path",
    };
  }

  // 7. Security: Block dangerous URL patterns
  const dangerousPatterns = [/javascript:/i, /data:/i, /vbscript:/i, /file:/i];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(redirectUrl)) {
      return {
        isValid: false,
        error: "Invalid URL protocol",
      };
    }
  }

  // 8. Security: Prevent URL encoding tricks
  // Decode the URL and check for double-encoding
  const decodedUrl = decodeURIComponent(redirectUrl);
  if (decodedUrl !== redirectUrl) {
    // If decoding changed the URL, check if it's still valid
    try {
      const reParsed = new URL(decodedUrl);
      if (reParsed.origin !== origin) {
        return {
          isValid: false,
          error: "URL encoding mismatch detected",
        };
      }
    } catch {
      return {
        isValid: false,
        error: "Invalid URL encoding",
      };
    }
  }

  return {
    isValid: true,
    sanitizedUrl: redirectUrl,
  };
}

/**
 * Gets the allowed redirect origins from environment/configuration
 * @returns Array of allowed origins
 */
export function getAllowedRedirectOrigins(): string[] {
  const origins = new Set<string>();

  // Add BASE_URL from environment
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    try {
      const parsed = new URL(baseUrl);
      origins.add(parsed.origin);
    } catch {
      // Ignore invalid BASE_URL
    }
  }

  // Add additional allowed origins from environment variable
  // Comma-separated list: https://app.example.com,https://staging.example.com
  const additionalOrigins = process.env.ALLOWED_REDIRECT_ORIGINS;
  if (additionalOrigins) {
    additionalOrigins.split(",").forEach((origin) => {
      const trimmed = origin.trim();
      if (trimmed) {
        try {
          const parsed = new URL(trimmed);
          origins.add(parsed.origin);
        } catch {
          // Try adding https:// prefix for bare domains
          try {
            const parsed = new URL(`https://${trimmed}`);
            origins.add(parsed.origin);
          } catch {
            // Ignore invalid origins
          }
        }
      }
    });
  }

  // Default fallback for development
  if (origins.size === 0 && process.env.NODE_ENV === "development") {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:3001");
  }

  return Array.from(origins);
}

/**
 * Creates a safe redirect URL for Stripe checkout
 * Uses path-based redirects to prevent open redirect attacks
 *
 * @param basePath - The base path for the redirect (e.g., '/dashboard')
 * @param queryParams - Optional query parameters to append
 * @returns The constructed redirect URL
 */
export function createSafeRedirectUrl(
  basePath: string,
  queryParams?: Record<string, string>,
): string {
  const origins = getAllowedRedirectOrigins();
  const baseUrl = origins[0] || process.env.BASE_URL || "http://localhost:3000";

  if (!baseUrl) {
    console.error("[SECURITY] No base URL configured for redirects");
  }

  // Ensure basePath starts with /
  const path = basePath.startsWith("/") ? basePath : `/${basePath}`;

  // Build query string if provided
  let queryString = "";
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams(queryParams);
    queryString = `?${params.toString()}`;
  }

  const redirectUrl = `${baseUrl}${path}${queryString}`;
  console.log("[SECURITY] Created redirect URL:", redirectUrl);

  return redirectUrl;
}
