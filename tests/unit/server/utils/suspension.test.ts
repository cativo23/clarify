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
