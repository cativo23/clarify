import { vi } from 'vitest'

// Mock Nuxt globals that are used at definition time
vi.stubGlobal('defineNuxtRouteMiddleware', (cb: any) => cb)
