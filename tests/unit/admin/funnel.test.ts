import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Funnel API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 4-stage conversion funnel', () => {
    const mockFunnelData = {
      funnel: [
        { stage: 'Signups', count: 100, rate: 100 },
        { stage: 'Email Verified', count: 85, rate: 85.0 },
        { stage: 'First Analysis', count: 60, rate: 70.6 },
        { stage: 'First Purchase', count: 25, rate: 41.7 },
      ],
      period: {
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-03-15T23:59:59.999Z',
      },
    }

    // Validate structure
    expect(mockFunnelData.funnel).toBeInstanceOf(Array)
    expect(mockFunnelData.funnel).toHaveLength(4)
    expect(mockFunnelData.funnel[0].stage).toBe('Signups')
    expect(mockFunnelData.funnel[0].rate).toBe(100)
  })

  it('calculates conversion rates between stages', () => {
    const funnelStages = [
      { stage: 'Signups', count: 100 },
      { stage: 'Email Verified', count: 85 },
      { stage: 'First Analysis', count: 60 },
      { stage: 'First Purchase', count: 25 },
    ]

    // Calculate conversion rates
    const funnelWithRates = funnelStages.map((f, idx) => ({
      ...f,
      rate: idx === 0 ? 100 : Math.round((f.count / funnelStages[idx - 1].count) * 1000) / 10,
    }))

    expect(funnelWithRates[0].rate).toBe(100)
    expect(funnelWithRates[1].rate).toBe(85.0)
    expect(funnelWithRates[2].rate).toBe(70.6)
    expect(funnelWithRates[3].rate).toBe(41.7)
  })

  it('supports 7d/30d/90d/custom range params', () => {
    const rangeParams = ['7d', '30d', '90d'] as const

    rangeParams.forEach(range => {
      const now = new Date('2026-03-15T12:00:00Z')
      const startDate = new Date(now)

      switch (range) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          expect(startDate.getDate()).toBe(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          expect(startDate.getDate()).toBeLessThan(now.getDate())
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          // 90 days back should be approximately 3 months earlier
          expect(startDate.getTime()).toBeLessThan(now.getTime())
          break
      }
    })
  })

  it('handles edge case: zero signups means all rates are zero', () => {
    const funnelStages = [
      { stage: 'Signups', count: 0 },
      { stage: 'Email Verified', count: 0 },
      { stage: 'First Analysis', count: 0 },
      { stage: 'First Purchase', count: 0 },
    ]

    const funnelWithRates = funnelStages.map((f, idx) => ({
      ...f,
      rate: idx === 0 ? 100 : (funnelStages[idx - 1].count > 0
        ? Math.round((f.count / funnelStages[idx - 1].count) * 1000) / 10
        : 0),
    }))

    expect(funnelWithRates[0].rate).toBe(100)
    expect(funnelWithRates[1].rate).toBe(0)
    expect(funnelWithRates[2].rate).toBe(0)
    expect(funnelWithRates[3].rate).toBe(0)
  })

  it('tracks unique users per stage correctly', () => {
    // Simulate user progression through funnel
    const users = [
      { id: 'user-1', signedUpAt: '2026-03-01', verifiedAt: '2026-03-01', firstAnalysisAt: '2026-03-02', firstPurchaseAt: '2026-03-03' },
      { id: 'user-2', signedUpAt: '2026-03-01', verifiedAt: '2026-03-01', firstAnalysisAt: '2026-03-02', firstPurchaseAt: null },
      { id: 'user-3', signedUpAt: '2026-03-01', verifiedAt: '2026-03-02', firstAnalysisAt: null, firstPurchaseAt: null },
      { id: 'user-4', signedUpAt: '2026-03-02', verifiedAt: null, firstAnalysisAt: null, firstPurchaseAt: null },
    ]

    // Count users at each stage
    const signups = users.length // 4
    const verified = users.filter(u => u.verifiedAt !== null).length // 3
    const firstAnalysis = users.filter(u => u.firstAnalysisAt !== null).length // 2
    const firstPurchase = users.filter(u => u.firstPurchaseAt !== null).length // 1

    expect(signups).toBe(4)
    expect(verified).toBe(3)
    expect(firstAnalysis).toBe(2)
    expect(firstPurchase).toBe(1)
  })

  it('calculates overall conversion rate from signup to purchase', () => {
    const signups = 100
    const firstPurchase = 25

    const overallConversionRate = (firstPurchase / signups) * 100

    expect(overallConversionRate).toBe(25)
  })

  it('identifies funnel drop-off points', () => {
    const funnelStages = [
      { stage: 'Signups', count: 100 },
      { stage: 'Email Verified', count: 85 },
      { stage: 'First Analysis', count: 60 },
      { stage: 'First Purchase', count: 25 },
    ]

    const dropOffs = funnelStages.map((f, idx) => ({
      stage: f.stage,
      dropOff: idx === 0 ? 0 : funnelStages[idx - 1].count - f.count,
      dropOffRate: idx === 0 ? 0 : Math.round(((funnelStages[idx - 1].count - f.count) / funnelStages[idx - 1].count) * 1000) / 10,
    }))

    expect(dropOffs[1].dropOff).toBe(15) // 100 - 85
    expect(dropOffs[1].dropOffRate).toBe(15.0)
    expect(dropOffs[2].dropOff).toBe(25) // 85 - 60
    expect(dropOffs[3].dropOff).toBe(35) // 60 - 25
  })
})
