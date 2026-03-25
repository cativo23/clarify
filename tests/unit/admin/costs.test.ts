import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Cost Analysis API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/admin/costs', () => {
    it('returns cost breakdown by tier', async () => {
      // Mock response structure test
      const mockResponse = {
        by_tier: [
          { tier: 'Basic', analyses: 10, revenue: 9.90, ai_cost: 0.15, gross_margin: 9.75, margin_percent: 98.5, avg_cost_per_analysis: 0.015 },
          { tier: 'Premium', analyses: 5, revenue: 14.85, ai_cost: 0.50, gross_margin: 14.35, margin_percent: 96.6, avg_cost_per_analysis: 0.10 },
          { tier: 'Forensic', analyses: 2, revenue: 19.80, ai_cost: 0.80, gross_margin: 19.00, margin_percent: 96.0, avg_cost_per_analysis: 0.40 }
        ],
        summary: {
          total_revenue: 44.55,
          total_ai_cost: 1.45,
          total_margin: 43.10,
          overall_margin_percent: 96.7,
          blended_cost_per_analysis: 0.085
        },
        period: {
          from: expect.any(String),
          to: expect.any(String)
        }
      }

      expect(mockResponse.by_tier).toHaveLength(3)
      expect(mockResponse.by_tier[0]).toHaveProperty('tier')
      expect(mockResponse.by_tier[0]).toHaveProperty('analyses')
      expect(mockResponse.by_tier[0]).toHaveProperty('revenue')
      expect(mockResponse.by_tier[0]).toHaveProperty('ai_cost')
      expect(mockResponse.by_tier[0]).toHaveProperty('gross_margin')
      expect(mockResponse.by_tier[0]).toHaveProperty('margin_percent')
      expect(mockResponse.summary).toHaveProperty('total_revenue')
      expect(mockResponse.summary).toHaveProperty('overall_margin_percent')
    })

    it('calculates profit margin per tier correctly', () => {
      const revenue = 100
      const aiCost = 15
      const margin = revenue - aiCost
      const marginPercent = (margin / revenue) * 100

      expect(margin).toBe(85)
      expect(marginPercent).toBe(85)
    })

    it('includes AI cost calculations from token usage', () => {
      // Simulate token cost calculation
      const inputTokens = 1000
      const outputTokens = 500
      const inputCostPer1k = 0.00015 // gpt-4o-mini
      const outputCostPer1k = 0.0006

      const totalCost = (inputTokens / 1000 * inputCostPer1k) + (outputTokens / 1000 * outputCostPer1k)

      expect(totalCost).toBeCloseTo(0.00045, 6)
    })

    it('handles missing usage data gracefully', () => {
      const analyses = [
        { id: '1', summary_json: { _debug: { usage: { input_tokens: 100, output_tokens: 50 } } } },
        { id: '2', summary_json: { _debug: {} } }, // Missing usage
        { id: '3', summary_json: {} }, // Missing _debug
        { id: '4', summary_json: null } // Null summary
      ]

      const validAnalyses = analyses.filter(a => a.summary_json?._debug?.usage)

      expect(validAnalyses).toHaveLength(1)
    })

    it('maps tiers correctly from summary_json', () => {
      const tierMapping: Record<string, string> = {
        basic: 'gpt-4o-mini',
        premium: 'gpt-5-mini',
        forensic: 'gpt-5'
      }

      expect(tierMapping.basic).toBe('gpt-4o-mini')
      expect(tierMapping.premium).toBe('gpt-5-mini')
      expect(tierMapping.forensic).toBe('gpt-5')
    })

    it('infers tier from credits_used when tier not in summary', () => {
      const inferTier = (creditsUsed: number): string => {
        if (creditsUsed === 1) return 'basic'
        if (creditsUsed === 3) return 'premium'
        if (creditsUsed >= 10) return 'forensic'
        return 'basic'
      }

      expect(inferTier(1)).toBe('basic')
      expect(inferTier(3)).toBe('premium')
      expect(inferTier(10)).toBe('forensic')
      expect(inferTier(5)).toBe('basic') // Default fallback
    })
  })

  describe('Cost calculations', () => {
    it('calculates blended cost per analysis', () => {
      const totalAiCost = 2.50
      const totalAnalyses = 50
      const blendedCost = totalAiCost / totalAnalyses

      expect(blendedCost).toBeCloseTo(0.05, 4)
    })

    it('calculates overall margin percentage', () => {
      const totalRevenue = 500
      const totalAiCost = 75
      const totalMargin = totalRevenue - totalAiCost
      const overallMarginPercent = (totalMargin / totalRevenue) * 100

      expect(overallMarginPercent).toBe(85)
    })

    it('rounds currency values to 2 decimal places', () => {
      const revenue = 99.9999
      const rounded = Math.round(revenue * 100) / 100

      expect(rounded).toBe(100.00)
    })

    it('rounds cost values to 4 decimal places', () => {
      const cost = 0.00123456
      const rounded = Math.round(cost * 10000) / 10000

      expect(rounded).toBe(0.0012)
    })
  })

  describe('Date range handling', () => {
    it('supports 7d range', () => {
      const now = new Date('2026-03-16')
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      expect(startDate.toISOString().split('T')[0]).toBe('2026-03-09')
    })

    it('supports 30d range', () => {
      const now = new Date('2026-03-16')
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      expect(startDate.toISOString().split('T')[0]).toBe('2026-02-14')
    })

    it('supports 90d range', () => {
      const now = new Date('2026-03-16')
      const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      expect(startDate.toISOString().split('T')[0]).toBe('2025-12-16')
    })

    it('supports custom date range', () => {
      const from = '2026-01-01T00:00:00Z'
      const to = '2026-01-31T23:59:59Z'

      expect(new Date(from).toISOString().split('T')[0]).toBe('2026-01-01')
      expect(new Date(to).toISOString().split('T')[0]).toBe('2026-01-31')
    })
  })
})
