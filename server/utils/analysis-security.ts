/**
 * Analysis Security Utilities
 * 
 * [SECURITY FIX M4] Backend enforcement of debug info access control
 * Ensures sensitive debug information is NEVER sent to non-admin users
 * 
 * Security Principle: Backend stripping > Frontend hiding
 * - Backend: Debug info physically not sent (secure)
 * - Frontend: Debug info sent but hidden (bypassable via DevTools)
 * 
 * Debug info is shown when EITHER:
 * - User is admin, OR
 * - tokenDebug config is enabled (for development/testing)
 */

import type { Analysis } from '~/types'

/**
 * Strip sensitive debug info from analysis summary
 * Returns full data for admins or when tokenDebug is enabled
 * 
 * @param summary - The analysis summary_json from database
 * @param isAdmin - Whether the user has admin privileges
 * @param tokenDebugEnabled - Whether debug output is enabled in config
 * @returns Sanitized summary (_debug removed for non-admins when tokenDebug is false)
 */
export function sanitizeAnalysisSummary(summary: any, isAdmin: boolean, tokenDebugEnabled: boolean = false): any {
  if (!summary || typeof summary !== 'object') {
    return summary
  }

  // Show debug info if:
  // 1. User is admin, OR
  // 2. tokenDebug is enabled (development/testing mode)
  if (isAdmin || tokenDebugEnabled) {
    return summary
  }

  // SECURITY: Completely remove _debug field for non-admins
  // This includes: token usage, model info, timestamps, preprocessing details
  const { _debug, ...userFacingSummary } = summary

  return userFacingSummary
}

/**
 * Strip debug info from multiple analyses
 * 
 * @param analyses - Array of analysis records
 * @param isAdmin - Whether the user has admin privileges
 * @param tokenDebugEnabled - Whether debug output is enabled in config
 * @returns Array of sanitized analyses
 */
export function sanitizeAnalysesList(analyses: Analysis[], isAdmin: boolean, tokenDebugEnabled: boolean = false): Analysis[] {
  if (!isAdmin && !tokenDebugEnabled) {
    return analyses.map(analysis => ({
      ...analysis,
      summary_json: sanitizeAnalysisSummary(analysis.summary_json, false, tokenDebugEnabled)
    }))
  }

  return analyses
}

/**
 * Get user context from request (auth + admin status)
 * Helper for API routes to determine access level
 * 
 * @param event - H3 event
 * @returns User context with admin flag
 */
export async function getRequestUserContext(event: any) {
  const { serverSupabaseUser } = await import('#supabase/server')
  
  try {
    const user = await serverSupabaseUser(event)
    
    if (!user) {
      return { userId: null, email: null, isAdmin: false, authenticated: false }
    }

    // Check admin status by comparing with admin email from runtime config
    const { useRuntimeConfig } = await import('h3')
    const config = useRuntimeConfig(event)
    const isAdmin = user.email === config.adminEmail

    return {
      userId: user.id,
      email: user.email,
      isAdmin,
      authenticated: true
    }
  } catch (error) {
    console.error('[Analysis Security] Error getting user context:', error)
    return { userId: null, email: null, isAdmin: false, authenticated: false }
  }
}

/**
 * Get tokenDebug config setting
 * When enabled, debug info is shown to all users (development/testing)
 */
export async function isTokenDebugEnabled(event: any): Promise<boolean> {
  try {
    const { getPromptConfig } = await import('./config')
    const { serverSupabaseClient } = await import('#supabase/server')
    
    const client = await serverSupabaseClient(event)
    const config = await getPromptConfig(client)
    
    return config.features?.tokenDebug || false
  } catch (error) {
    console.error('[Analysis Security] Error checking tokenDebug config:', error)
    return false
  }
}
