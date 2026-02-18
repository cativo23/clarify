/**
 * Secure Error Handling Utility
 * 
 * [SECURITY FIX H3] Prevents information disclosure by sanitizing error messages
 * returned to clients while logging full details server-side for debugging.
 * 
 * Impact: Prevents attackers from using error messages for reconnaissance.
 */

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SERVER = 'SERVER_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR'
}

/**
 * Safe error response structure
 */
export interface SafeError {
  type: ErrorType
  message: string
  code?: string
  details?: Record<string, any>
}

/**
 * Error categories and their safe messages
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'Invalid request. Please check your input and try again.',
  [ErrorType.AUTHENTICATION]: 'Authentication required. Please log in and try again.',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.PAYMENT_REQUIRED]: 'Insufficient credits. Please purchase more credits to continue.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorType.SERVER]: 'An unexpected error occurred. Please try again later.',
  [ErrorType.EXTERNAL_SERVICE]: 'A service is temporarily unavailable. Please try again later.'
}

/**
 * Patterns that indicate sensitive information in error messages
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /key/i,
  /token/i,
  /credential/i,
  /api[_-]?key/i,
  /private/i,
  /connection\s*string/i,
  /database\s*url/i,
  /host/i,
  /port/i,
  /user.*name/i,
  /email.*address/i,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
  /mongodb:\/\//i,
  /postgresql:\/\//i,
  /mysql:\/\//i,
  /redis:\/\//i,
  /stack\s*trace/i,
  /at\s+\w+.*\(.+\)/, // Stack trace lines
  /column/i,
  /table/i,
  /schema/i,
  /sql/i,
  /syntax.*error/i,
]

/**
 * Sanitize error message to remove sensitive information
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message

  // Check for sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(sanitized)) {
      // If sensitive info detected, return generic message
      return ERROR_MESSAGES[ErrorType.SERVER]
    }
  }

  // Remove technical details in parentheses
  sanitized = sanitized.replace(/\s*\([^)]*\)/g, '')

  // Remove file paths
  sanitized = sanitized.replace(/[/\\][\w/.-]+/g, '[path]')

  // Limit length
  if (sanitized.length > 150) {
    sanitized = sanitized.substring(0, 147) + '...'
  }

  return sanitized.trim() || ERROR_MESSAGES[ErrorType.SERVER]
}

/**
 * Categorize error based on type and message
 */
function categorizeError(error: any): ErrorType {
  if (!error) return ErrorType.SERVER

  const message = (error.message || '').toLowerCase()
  const statusCode = error.statusCode || error.status

  // Authentication errors
  if (statusCode === 401 || message.includes('unauthenticated') || message.includes('login')) {
    return ErrorType.AUTHENTICATION
  }

  // Authorization errors
  if (statusCode === 403 || message.includes('unauthorized') || message.includes('permission')) {
    return ErrorType.AUTHORIZATION
  }

  // Validation errors
  if (statusCode === 400 || message.includes('invalid') || message.includes('required')) {
    return ErrorType.VALIDATION
  }

  // Payment errors
  if (statusCode === 402 || message.includes('credit') || message.includes('payment')) {
    return ErrorType.PAYMENT_REQUIRED
  }

  // Not found
  if (statusCode === 404 || message.includes('not found')) {
    return ErrorType.NOT_FOUND
  }

  // Rate limiting
  if (statusCode === 429 || message.includes('rate limit') || message.includes('too many')) {
    return ErrorType.RATE_LIMIT
  }

  // External service errors
  if (error.code?.startsWith('ECONN') ||
    error.code === 'ETIMEDOUT' ||
    message.includes('openai') ||
    message.includes('stripe') ||
    message.includes('network')) {
    return ErrorType.EXTERNAL_SERVICE
  }

  // Default to server error
  return ErrorType.SERVER
}

/**
 * Log error for debugging and security auditing
 */
function logError(error: any, context: {
  userId?: string | undefined
  endpoint?: string | undefined
  operation?: string | undefined
}) {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    userId: context.userId || 'anonymous',
    endpoint: context.endpoint || 'unknown',
    operation: context.operation || 'unknown',
    errorType: error?.constructor?.name || 'Error',
    message: error?.message,
    stack: error?.stack,
    code: error?.code,
    statusCode: error?.statusCode || error?.status
  }

  // Log full error details server-side (never exposed to client)
  console.error('[SECURITY ERROR LOG]', JSON.stringify(errorDetails, null, 2))
}

/**
 * Create a safe error response for client
 * 
 * @param error - The caught error
 * @param options - Optional context for logging and customization
 * @returns SafeError object safe for client consumption
 */
export function createSafeError(
  error: any,
  options?: {
    userId?: string | undefined
    endpoint?: string | undefined
    operation?: string | undefined
    defaultMessage?: string | undefined
  }
): SafeError {
  // Log the full error server-side
  logError(error, {
    userId: options?.userId,
    endpoint: options?.endpoint,
    operation: options?.operation
  })

  // Categorize the error
  const errorType = categorizeError(error)

  // Get safe message
  let message: string

  if (options?.defaultMessage) {
    message = options.defaultMessage
  } else if (errorType === ErrorType.VALIDATION) {
    // For validation errors, prefer the first specific error detail
    if (error?.data?.errors && error.data.errors.length > 0) {
      message = error.data.errors[0].message
    } else {
      message = sanitizeErrorMessage(error?.message || ERROR_MESSAGES[errorType])
    }
  } else {
    // For all other errors, use the safe default
    message = ERROR_MESSAGES[errorType]
  }

  return {
    type: errorType,
    message,
    code: error?.code
  }
}

/**
 * Handle error and throw as Nuxt error with safe message
 * 
 * @param error - The caught error
 * @param options - Context options
 * @throws Nuxt error with sanitized message
 */
export function handleApiError(
  error: any,
  options?: {
    userId?: string | undefined
    endpoint?: string | undefined
    operation?: string | undefined
    statusCode?: number | undefined
  }
): never {
  const safeError = createSafeError(error, options)

  const statusCode = options?.statusCode ||
    error?.statusCode ||
    error?.status ||
    getStatusCodeForErrorType(safeError.type)

  // Preserve validation error details for client feedback
  const responseData: any = {
    type: safeError.type,
    code: safeError.code
  }

  // Include validation details if present and it's a validation error
  if (safeError.type === ErrorType.VALIDATION && error?.data?.errors) {
    responseData.errors = error.data.errors
  }

  throw createError({
    statusCode,
    message: safeError.message,
    data: responseData
  })
}

/**
 * Get HTTP status code for error type
 */
function getStatusCodeForErrorType(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.VALIDATION:
      return 400
    case ErrorType.AUTHENTICATION:
      return 401
    case ErrorType.AUTHORIZATION:
      return 403
    case ErrorType.NOT_FOUND:
      return 404
    case ErrorType.PAYMENT_REQUIRED:
      return 402
    case ErrorType.RATE_LIMIT:
      return 429
    case ErrorType.EXTERNAL_SERVICE:
      return 503
    default:
      return 500
  }
}

/**
 * Wrap a promise with safe error handling
 * 
 * @param promise - The promise to execute
 * @param options - Error handling options
 * @returns Promise result or throws safe error
 */
export async function withSafeErrorHandling<T>(
  promise: Promise<T>,
  options: {
    userId?: string | undefined
    endpoint?: string | undefined
    operation: string
    errorMessage?: string | undefined
  }
): Promise<T> {
  try {
    return await promise
  } catch (error: any) {
    handleApiError(error, {
      userId: options.userId,
      endpoint: options.endpoint,
      operation: options.operation,
      statusCode: 500
    })
  }
}
