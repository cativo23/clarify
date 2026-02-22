import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAdminUser, requireAdmin } from '@/server/utils/auth'
import type { H3Event } from 'h3'

// Mock dependencies
const mockUser = vi.fn()
const mockClient = vi.fn()
const mockRuntimeConfig = vi.fn()

vi.mock('#supabase/server', () => ({
    serverSupabaseUser: (...args: any[]) => mockUser(...args),
    serverSupabaseClient: (...args: any[]) => mockClient(...args),
}))

// Mock useRuntimeConfig global
vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)

// Mock createError
vi.stubGlobal('createError', (err: any) => err)

describe('Server Auth Utils', () => {
    let mockEvent: H3Event

    beforeEach(() => {
        vi.clearAllMocks()
        mockEvent = {} as H3Event
        mockUser.mockResolvedValue(null)
        mockRuntimeConfig.mockReturnValue({
            adminEmail: 'admin@clarify.com'
        })

        // Default mock for DB client
        mockClient.mockResolvedValue({
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })
    })

    describe('isAdminUser', () => {
        it('should return false if no user is logged in', async () => {
            mockUser.mockResolvedValue(null)
            const result = await isAdminUser(mockEvent)
            expect(result).toBe(false)
        })

        it('should return false if user email does not match config or db', async () => {
            mockUser.mockResolvedValue({ email: 'user@clarify.com' })
            const result = await isAdminUser(mockEvent)
            expect(result).toBe(false)
        })

        it('should return true if user email matches config.adminEmail', async () => {
            mockUser.mockResolvedValue({ email: 'admin@clarify.com' })
            const result = await isAdminUser(mockEvent)
            expect(result).toBe(true)
        })

        it('should normalize email before checking config', async () => {
            // Case insensitive check
            mockUser.mockResolvedValue({ email: 'ADMIN@CLARIFY.COM' })
            const result = await isAdminUser(mockEvent)
            expect(result).toBe(true)

            // Whitespace check
            mockUser.mockResolvedValue({ email: ' admin@clarify.com ' })
            const result2 = await isAdminUser(mockEvent)
            expect(result2).toBe(true)
        })

        it('should check database if config does not match', async () => {
            mockUser.mockResolvedValue({ email: 'secondary_admin@clarify.com' })

            // Mock DB response finding the user
            const mockSelect = vi.fn().mockReturnThis()
            const mockEqEmail = vi.fn().mockReturnThis()
            const mockEqActive = vi.fn().mockReturnThis()
            const mockMaybeSingle = vi.fn().mockResolvedValue({
                data: { email: 'secondary_admin@clarify.com' },
                error: null
            })

            mockClient.mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: mockSelect
                })
            })

            mockSelect.mockReturnValue({ eq: mockEqEmail })
            mockEqEmail.mockReturnValue({ eq: mockEqActive })
            mockEqActive.mockReturnValue({ maybeSingle: mockMaybeSingle })

            const result = await isAdminUser(mockEvent)
            expect(result).toBe(true)

            // Verify DB query chain
            expect(mockClient).toHaveBeenCalled()
            expect(mockSelect).toHaveBeenCalledWith('email')
            expect(mockEqEmail).toHaveBeenCalledWith('email', 'secondary_admin@clarify.com')
            expect(mockEqActive).toHaveBeenCalledWith('is_active', true)
        })

        it('should return false if db query fails/returns no data', async () => {
            mockUser.mockResolvedValue({ email: 'hacker@clarify.com' })

            // DB returns null
            const mockSelect = vi.fn().mockReturnThis()
            const mockEq = vi.fn().mockReturnThis()
            const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

            mockClient.mockResolvedValue({
                from: vi.fn().mockReturnValue({ select: mockSelect })
            })
            mockSelect.mockReturnValue({ eq: mockEq })
            mockEq.mockReturnValue({ eq: mockEq })
            mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })

            const result = await isAdminUser(mockEvent)
            expect(result).toBe(false)
        })

        it('should fallback to config check if DB throws error', async () => {
            mockUser.mockResolvedValue({ email: 'admin@clarify.com' })

            // Mock DB throwing error
            mockClient.mockRejectedValue(new Error('DB Connection Failed'))

            const result = await isAdminUser(mockEvent)
            expect(result).toBe(true) // Should still be true because it matches config
        })
    })

    describe('requireAdmin', () => {
        it('should throw 401 if user is not admin', async () => {
            mockUser.mockResolvedValue({ email: 'user@clarify.com' })

            await expect(requireAdmin(mockEvent)).rejects.toMatchObject({
                statusCode: 401,
                message: 'Unauthorized'
            })
        })

        it('should not throw if user is admin', async () => {
            mockUser.mockResolvedValue({ email: 'admin@clarify.com' })

            await expect(requireAdmin(mockEvent)).resolves.not.toThrow()
        })
    })
})
