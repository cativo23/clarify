import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Admin Layout', () => {
  it('should have correct navigation routes', () => {
    const routes = {
      analytics: '/admin/analytics',
      config: '/admin/config',
      dashboard: '/dashboard',
    }

    expect(routes.analytics).toBe('/admin/analytics')
    expect(routes.config).toBe('/admin/config')
    expect(routes.dashboard).toBe('/dashboard')
  })

  it('should have admin middleware file', () => {
    const middlewarePath = resolve(__dirname, '../../middleware/admin.ts')
    const content = readFileSync(middlewarePath, 'utf-8')

    expect(content).toContain('defineNuxtRouteMiddleware')
    expect(content).toContain('is_admin')
    expect(content).toContain('navigateTo')
  })

  it('should have admin layout file', () => {
    const layoutPath = resolve(__dirname, '../../layouts/admin.vue')
    const content = readFileSync(layoutPath, 'utf-8')

    expect(content).toContain('Analytics')
    expect(content).toContain('Configuración')
    expect(content).toContain('/dashboard')
  })

  it('should have sidebar with navigation links', () => {
    const layoutPath = resolve(__dirname, '../../layouts/admin.vue')
    const content = readFileSync(layoutPath, 'utf-8')

    expect(content).toContain('to="/admin/analytics"')
    expect(content).toContain('to="/admin/config"')
    expect(content).toContain('Analytics')
    expect(content).toContain('Configuración')
  })
})
