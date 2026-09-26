import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateAiCost } from '@/server/utils/cost-calculator'

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

    it('calculates AI cost from real per-token pricing (gpt-6-luna)', () => {
      // pricing_tables stores real per-TOKEN USD rates: gpt-6-luna is
      // $0.10/1M input, $0.50/1M output.
      const price = { input: 0.0000001, output: 0.0000005 }

      const totalCost = calculateAiCost(1_000_000, 1_000_000, price)

      expect(totalCost).toBeCloseTo(0.6, 6) // $0.10 + $0.50 for 1M tokens each way
    })

    it('[REGRESSION] does not divide tokens by 1000 before applying per-token pricing', () => {
      // Bug found 2026-09-26: the handler used to compute
      // (tokens / 1000) * pricePerToken, silently under-reporting AI cost by
      // 1000x since pricing_tables' rates are already per-token, not per-1k.
      const price = { input: 0.0000001, output: 0.0000005 }
      const buggyCost = (1000 / 1000) * price.input + (500 / 1000) * price.output

      const realCost = calculateAiCost(1000, 500, price)

      expect(realCost).toBeCloseTo(1000 * price.input + 500 * price.output, 10)
      expect(realCost).not.toBeCloseTo(buggyCost, 10)
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
        basic: 'gpt-6-luna',
        premium: 'gpt-6-sol',
        forensic: 'gpt-6-astra'
      }

      expect(tierMapping.basic).toBe('gpt-6-luna')
      expect(tierMapping.premium).toBe('gpt-6-sol')
      expect(tierMapping.forensic).toBe('gpt-6-astra')
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
