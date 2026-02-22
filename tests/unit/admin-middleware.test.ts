import { describe, it, expect, vi, beforeEach } from 'vitest'
import adminMiddleware from '@/middleware/admin' // This will import the default export

// Mocks
const mockNavigateTo = vi.fn()
const mockUseSupabaseUser = vi.fn()
const mockUseUserState = vi.fn()
const mockIsUserProfileStale = vi.fn()
const mockFetchUserProfile = vi.fn()

// Stub globals
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useSupabaseUser', mockUseSupabaseUser)
vi.stubGlobal('defineNuxtRouteMiddleware', (cb: any) => cb) // Pass through the callback

// Mock Composables
vi.mock('~/composables/useSupabase', () => ({
  useUserState: () => mockUseUserState(),
  isUserProfileStale: () => mockIsUserProfileStale(),
  fetchUserProfile: (...args: any[]) => mockFetchUserProfile(...args)
}))


describe('Admin Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Defaults
    mockUseSupabaseUser.mockReturnValue({ value: { email: 'test@example.com' } }) // Logged in
    mockUseUserState.mockReturnValue({ value: { is_admin: true, isAuthenticated: true } }) // Is Admin
    mockIsUserProfileStale.mockReturnValue(false)
  })

  it('should redirect to login if user is not authenticated', async () => {
    mockUseSupabaseUser.mockReturnValue({ value: null })

    await adminMiddleware({} as any, {} as any)

    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
  })

  it('should redirect to home if user is not admin', async () => {
    mockUseUserState.mockReturnValue({ value: { is_admin: false } })

    await adminMiddleware({} as any, {} as any)

    expect(mockNavigateTo).toHaveBeenCalledWith('/')
  })

  it('should allow access if user is admin', async () => {
    mockUseUserState.mockReturnValue({ value: { is_admin: true } })

    await adminMiddleware({} as any, {} as any)

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('should refresh profile if stale', async () => {
    mockIsUserProfileStale.mockReturnValue(true)

    await adminMiddleware({} as any, {} as any)

    expect(mockFetchUserProfile).toHaveBeenCalledWith(true)
  })

  it('should refresh profile if user state is missing', async () => {
    mockUseUserState.mockReturnValue({ value: null })
    // If state is null, we assume fetchUserProfile will populate it eventually, 
    // but meant for the test we just check it was called.
    // In real code: const isAdmin = userState.value?.is_admin
    // If userState is still null after fetch, isAdmin is undefined -> false -> redirect

    await adminMiddleware({} as any, {} as any)

    expect(mockFetchUserProfile).toHaveBeenCalledWith(true)
    expect(mockNavigateTo).toHaveBeenCalledWith('/') // Because mockFetch didn't update state
  })
})
