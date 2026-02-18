import { URL } from 'url'

/**
 * Validates that a file URL belongs to the official Supabase storage bucket
 * to prevent Server-Side Request Forgery (SSRF) attacks.
 * 
 * @param fileUrl - The URL to validate
 * @param supabaseUrl - The Supabase project URL from environment
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateSupabaseStorageUrl(
  fileUrl: string,
  supabaseUrl: string
): { isValid: boolean; error?: string; storagePath?: string } {
  // 1. Basic validation
  if (!fileUrl || typeof fileUrl !== 'string') {
    return { isValid: false, error: 'Invalid or missing file URL' }
  }

  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    return { isValid: false, error: 'Server configuration error: Missing Supabase URL' }
  }

  // 2. Parse the URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(fileUrl)
  } catch {
    return { isValid: false, error: 'Invalid URL format' }
  }

  // 3. Ensure HTTPS only (prevent http:// and protocol-relative URLs)
  if (parsedUrl.protocol !== 'https:') {
    return { 
      isValid: false, 
      error: 'Only HTTPS URLs are allowed' 
    }
  }

  // 4. Parse Supabase URL to get allowed host
  let parsedSupabaseUrl: URL
  try {
    parsedSupabaseUrl = new URL(supabaseUrl)
  } catch {
    return { isValid: false, error: 'Server configuration error: Invalid Supabase URL' }
  }

  // 5. Verify the host belongs to Supabase
  const allowedHost = parsedSupabaseUrl.hostname
  const fileHost = parsedUrl.hostname

  // Check for exact match or Supabase domain pattern
  const isSupabaseDomain = fileHost === allowedHost || 
    fileHost.endsWith('.supabase.co') ||
    fileHost.endsWith('.supabase.in')

  if (!isSupabaseDomain) {
    return {
      isValid: false,
      error: 'URL must be from the configured Supabase storage'
    }
  }

  // 6. Verify the path structure for Supabase Storage
  // Two possible formats:
  // - Public URL: /storage/v1/object/public/{bucket}/{path}
  // - Auth URL: /storage/v1/object/auth/{bucket}/{path}
  // - Internal URL: /storage/v1/object/{bucket}/{path}
  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)

  let storagePath: string
  let bucket: string

  // Check for public/auth URL format: /storage/v1/object/public/{bucket}/{path}
  if (pathSegments[0] === 'storage' && pathSegments[1] === 'v1' && pathSegments[2] === 'object') {
    // Check if there's a visibility modifier (public/auth)
    const hasVisibility = pathSegments[3] === 'public' || pathSegments[3] === 'auth'
    
    if (hasVisibility) {
      // Format: /storage/v1/object/public/{bucket}/{path}
      if (pathSegments.length < 6) {
        return {
          isValid: false,
          error: 'Invalid storage URL structure'
        }
      }
      bucket = pathSegments[4]
      storagePath = pathSegments.slice(5).join('/')
    } else {
      // Internal format: /storage/v1/object/{bucket}/{path}
      if (pathSegments.length < 5) {
        return {
          isValid: false,
          error: 'Invalid storage URL structure'
        }
      }
      bucket = pathSegments[3]
      storagePath = pathSegments.slice(4).join('/')
    }
  }
  else {
    return {
      isValid: false,
      error: 'URL must be a valid Supabase Storage URL'
    }
  }

  // 7. Verify it's from the 'contracts' bucket (our application bucket)
  if (bucket !== 'contracts') {
    return {
      isValid: false,
      error: 'URL must be from the contracts storage bucket'
    }
  }

  // 8. Validate storage path exists
  if (!storagePath || storagePath.length === 0) {
    return {
      isValid: false,
      error: 'Storage path is required'
    }
  }

  // 10. Security: Prevent path traversal attacks
  if (storagePath.includes('..') || storagePath.includes('//')) {
    return {
      isValid: false,
      error: 'Invalid storage path'
    }
  }

  // 11. Security: Ensure path doesn't start with dangerous patterns
  if (storagePath.startsWith('/') || storagePath.startsWith('\\')) {
    return {
      isValid: false,
      error: 'Invalid storage path format'
    }
  }

  return {
    isValid: true,
    storagePath
  }
}

/**
 * Blocks requests to private/internal IP addresses to prevent SSRF
 * This is a defense-in-depth measure for any URL-based operations
 */
export function isPrivateIP(hostname: string): boolean {
  // Skip DNS resolution check for Supabase domains (they're trusted)
  if (hostname.endsWith('.supabase.co') || hostname.endsWith('.supabase.in')) {
    return false
  }

  // Check for localhost/internal hosts
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ]

  return privatePatterns.some(pattern => pattern.test(hostname))
}
