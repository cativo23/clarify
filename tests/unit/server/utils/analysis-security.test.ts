import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRequestUserContext } from '@/server/utils/analysis-security'
import type { H3Event } from 'h3'

const mockClient = vi.fn()
const mockRuntimeConfig = vi.fn()

vi.mock('#supabase/server', () => ({
    serverSupabaseClient: (...args: any[]) => mockClient(...args),
}))

vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)

function clientWith(user: { email: string | null } | null, adminTableMatch = false) {
    const maybeSingle = vi.fn().mockResolvedValue({
        data: adminTableMatch ? { email: user?.email } : null,
        error: null,
    })
    return {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({ maybeSingle }),
                }),
            }),
        }),
    }
}

describe('getRequestUserContext (security #36)', () => {
    let event: H3Event
    beforeEach(() => {
        vi.clearAllMocks()
        event = {} as H3Event
        mockRuntimeConfig.mockReturnValue({ adminEmail: 'admin@clarify.com' })
    })

    it('returns unauthenticated context when no user', async () => {
        mockClient.mockResolvedValue(clientWith(null))
        const ctx = await getRequestUserContext(event)
        expect(ctx).toEqual({ userId: null, email: null, isAdmin: false, authenticated: false })
    })

    it('flags admin via config.adminEmail (case-insensitive)', async () => {
        mockClient.mockResolvedValue(clientWith({ email: 'ADMIN@clarify.com' } as any))
        const ctx = await getRequestUserContext(event)
        expect(ctx.authenticated).toBe(true)
        expect(ctx.isAdmin).toBe(true)
    })

    it('flags admin via admin_emails table when config does not match', async () => {
        mockClient.mockResolvedValue(clientWith({ email: 'secondary@clarify.com' } as any, true))
        const ctx = await getRequestUserContext(event)
        expect(ctx.isAdmin).toBe(true)
    })

    it('returns isAdmin=false for non-admin users', async () => {
        mockClient.mockResolvedValue(clientWith({ email: 'random@user.com' } as any))
        const ctx = await getRequestUserContext(event)
        expect(ctx.authenticated).toBe(true)
        expect(ctx.isAdmin).toBe(false)
    })
})
