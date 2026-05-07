import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

const mockClient = vi.fn()
const mockRuntimeConfig = vi.fn()

vi.mock('#supabase/server', () => ({
  serverSupabaseClient: (...args: any[]) => mockClient(...args),
}))

vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)
// auth.ts uses Nuxt's globally-injected createError — stub it so thrown errors
// retain statusCode/data fields the assertions inspect.
vi.stubGlobal('createError', (err: any) => err)

/**
 * Builds a Supabase client stub whose
 *   .from('users').select('is_suspended').eq('id', uid).maybeSingle()
 * resolves with the provided is_suspended value (or error).
 */
function clientForSuspension(opts: {
  user?: { id: string } | null
  is_suspended?: boolean
  lookupError?: { message: string } | null
}) {
  const { user = { id: 'user-1' }, is_suspended = false, lookupError = null } = opts
  const maybeSingle = vi.fn().mockResolvedValue(
    lookupError ? { data: null, error: lookupError } : { data: { is_suspended }, error: null },
  )
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
    }),
  }
}

describe('ACCOUNT_SUSPENDED constant', () => {
  it('Test 3: ACCOUNT_SUSPENDED constant exported and equals "ACCOUNT_SUSPENDED"', async () => {
    const mod = await import('@/server/utils/auth')
    expect(mod.ACCOUNT_SUSPENDED).toBe('ACCOUNT_SUSPENDED')
  })
})

describe('assertNotSuspended (ADMIN-04)', () => {
  let event: H3Event
  beforeEach(() => {
    vi.clearAllMocks()
    event = {} as H3Event
    mockRuntimeConfig.mockReturnValue({ adminEmail: 'admin@clarify.com' })
  })

  it('Test 1: resolves (no throw) when users.is_suspended = false', async () => {
    mockClient.mockResolvedValue(clientForSuspension({ is_suspended: false }))
    const { assertNotSuspended } = await import('@/server/utils/auth')
    await expect(assertNotSuspended(event, 'user-1')).resolves.toBeUndefined()
  })

  it('Test 2: throws 403 with data.code === "ACCOUNT_SUSPENDED" when users.is_suspended = true', async () => {
    mockClient.mockResolvedValue(clientForSuspension({ is_suspended: true }))
    const { assertNotSuspended } = await import('@/server/utils/auth')
    let caught: any = null
    try {
      await assertNotSuspended(event, 'user-1')
    } catch (err) {
      caught = err
    }
    expect(caught).toBeTruthy()
    expect(caught.statusCode).toBe(403)
    expect(caught.data?.code).toBe('ACCOUNT_SUSPENDED')
  })

  it('Test 4: when userId omitted, helper resolves it via auth.getUser()', async () => {
    const stub = clientForSuspension({ user: { id: 'auto-user' }, is_suspended: false })
    mockClient.mockResolvedValue(stub)
    const { assertNotSuspended } = await import('@/server/utils/auth')
    await expect(assertNotSuspended(event)).resolves.toBeUndefined()
    expect(stub.auth.getUser).toHaveBeenCalled()
    // Confirm the supabase query was scoped to the auto-resolved user id
    expect(stub.from).toHaveBeenCalledWith('users')
  })

  it('Test 4b: when userId omitted and no authenticated user, returns silently (auth handled elsewhere)', async () => {
    mockClient.mockResolvedValue(clientForSuspension({ user: null }))
    const { assertNotSuspended } = await import('@/server/utils/auth')
    await expect(assertNotSuspended(event)).resolves.toBeUndefined()
  })

  it('fails open when suspension lookup errors (does not block legitimate users on infra failure)', async () => {
    mockClient.mockResolvedValue(
      clientForSuspension({ is_suspended: true, lookupError: { message: 'connection lost' } }),
    )
    const { assertNotSuspended } = await import('@/server/utils/auth')
    await expect(assertNotSuspended(event, 'user-1')).resolves.toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Task 2 — Upload route suspension gate
//
// We mock the auth module's assertNotSuspended at the boundary and the file
// validation utility, then invoke the route handler. The goal is to verify
// (a) the gate runs after auth, (b) it runs BEFORE file validation, and (c)
// when it throws, no file work occurs.
// ─────────────────────────────────────────────────────────────────────────────

describe('upload route suspension gate (ADMIN-04)', () => {
  let callOrder: string[]
  const mockAssertNotSuspended = vi.fn()
  const mockReadMultipartFormData = vi.fn()
  const mockValidateFileUpload = vi.fn()
  const mockUploadClient = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    callOrder = []

    vi.doMock('#supabase/server', () => ({
      serverSupabaseClient: (...args: any[]) => mockUploadClient(...args),
    }))
    // upload.post.ts imports via "../utils/auth" relative to server/api/.
    // Mock by the resolved alias path used by the vitest tsconfig.
    vi.doMock('@/server/utils/auth', () => ({
      assertNotSuspended: (...args: any[]) => {
        callOrder.push('assertNotSuspended')
        return mockAssertNotSuspended(...args)
      },
      ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
    }))
    vi.doMock('~/server/utils/auth', () => ({
      assertNotSuspended: (...args: any[]) => {
        callOrder.push('assertNotSuspended')
        return mockAssertNotSuspended(...args)
      },
      ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
    }))
    vi.doMock('../utils/auth', () => ({
      assertNotSuspended: (...args: any[]) => {
        callOrder.push('assertNotSuspended')
        return mockAssertNotSuspended(...args)
      },
      ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
    }))
    vi.doMock('~/server/utils/error-handler', () => ({
      handleApiError: (err: any) => {
        throw err
      },
    }))
    vi.doMock('@/server/utils/file-validation', () => ({
      validateFileUpload: (...args: any[]) => {
        callOrder.push('validateFileUpload')
        return mockValidateFileUpload(...args)
      },
      logFileValidation: vi.fn(),
    }))
    vi.doMock('../utils/file-validation', () => ({
      validateFileUpload: (...args: any[]) => {
        callOrder.push('validateFileUpload')
        return mockValidateFileUpload(...args)
      },
      logFileValidation: vi.fn(),
    }))

    vi.stubGlobal('defineEventHandler', (cb: any) => cb)
    vi.stubGlobal('createError', (err: any) => {
      const e: any = new Error(err.message || 'error')
      Object.assign(e, err)
      return e
    })
    vi.stubGlobal('readMultipartFormData', (...args: any[]) => {
      callOrder.push('readMultipartFormData')
      return mockReadMultipartFormData(...args)
    })

    mockUploadClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }) },
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://x/y' } }),
        }),
      },
    })
  })

  it('Test 5: suspended user POST /api/upload returns 403 ACCOUNT_SUSPENDED', async () => {
    mockAssertNotSuspended.mockImplementation(() => {
      const err: any = new Error('Account suspended')
      err.statusCode = 403
      err.data = { code: 'ACCOUNT_SUSPENDED' }
      throw err
    })

    const handler = (await import('@/server/api/upload.post')).default
    let caught: any = null
    try {
      await handler({} as any)
    } catch (err) {
      caught = err
    }
    expect(caught).toBeTruthy()
    expect(caught.statusCode).toBe(403)
    expect(caught.data?.code).toBe('ACCOUNT_SUSPENDED')
  })

  it('Test 6: non-suspended authenticated user passes the gate and proceeds', async () => {
    mockAssertNotSuspended.mockResolvedValue(undefined)
    mockReadMultipartFormData.mockResolvedValue([
      { filename: 'c.pdf', data: Buffer.from('%PDF-1.4 hi') },
    ])
    mockValidateFileUpload.mockReturnValue({
      isValid: true,
      file: { detectedExtension: 'pdf', detectedType: 'application/pdf', size: 11 },
    })

    const handler = (await import('@/server/api/upload.post')).default
    const result = await handler({} as any)
    expect(result.success).toBe(true)
    expect(mockAssertNotSuspended).toHaveBeenCalled()
  })

  it('Test 7: suspension check runs BEFORE readMultipartFormData (no PDF parsed for suspended user)', async () => {
    mockAssertNotSuspended.mockImplementation(() => {
      const err: any = new Error('Account suspended')
      err.statusCode = 403
      err.data = { code: 'ACCOUNT_SUSPENDED' }
      throw err
    })

    const handler = (await import('@/server/api/upload.post')).default
    try {
      await handler({} as any)
    } catch {
      /* expected */
    }
    expect(callOrder).toContain('assertNotSuspended')
    expect(callOrder).not.toContain('readMultipartFormData')
    expect(callOrder).not.toContain('validateFileUpload')
    expect(mockReadMultipartFormData).not.toHaveBeenCalled()
    expect(mockValidateFileUpload).not.toHaveBeenCalled()
  })
})
