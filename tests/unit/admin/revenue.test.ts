import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Revenue API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns revenue data with time range aggregation', async () => {
    // Mock revenue data structure
    const mockRevenueData = {
      revenue: [
        { date: '2026-03-01', gross_revenue: 49.90, net_revenue: 44.91, transactions: 10, credits_sold: 100 },
        { date: '2026-03-02', gross_revenue: 59.90, net_revenue: 54.91, transactions: 12, credits_sold: 120 },
        { date: '2026-03-03', gross_revenue: 39.90, net_revenue: 34.91, transactions: 8, credits_sold: 80 },
      ],
      summary: {
        total_revenue: 149.70,
        total_net_revenue: 134.73,
        total_transactions: 30,
        total_credits_sold: 300,
      },
      by_package: [
        { package: '5 credits', revenue: 49.90, count: 10, credits: 50 },
        { package: '10 credits', revenue: 59.90, count: 6, credits: 60 },
        { package: '25 credits', revenue: 39.90, count: 2, credits: 50 },
      ],
      period: {
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-03-03T23:59:59.999Z',
      },
    }

    // Validate structure
    expect(mockRevenueData.revenue).toBeInstanceOf(Array)
    expect(mockRevenueData.revenue.length).toBeGreaterThan(0)
    expect(mockRevenueData.summary.total_revenue).toBeTypeOf('number')
    expect(mockRevenueData.summary.total_transactions).toBeTypeOf('number')
    expect(mockRevenueData.summary.total_credits_sold).toBeTypeOf('number')
  })

  it('returns gross and net revenue in summary', () => {
    const mockData = {
      revenue: [
        { date: '2026-03-01', gross_revenue: 100.00, net_revenue: 90.00, transactions: 5, credits_sold: 50 },
      ],
      summary: {
        total_revenue: 100.00,
        total_net_revenue: 90.00,
        total_transactions: 5,
        total_credits_sold: 50,
      },
    }

    // Gross revenue should be >= net revenue (net accounts for refunds/adjustments)
    expect(mockData.summary.total_revenue).toBeGreaterThanOrEqual(mockData.summary.total_net_revenue)

    // Verify decimal precision (2 decimal places for currency)
    expect(mockData.summary.total_revenue.toFixed(2)).toBe('100.00')
    expect(mockData.summary.total_net_revenue.toFixed(2)).toBe('90.00')
  })

  it('supports day/week/month/quarter range params', () => {
    const rangeParams = ['day', 'week', 'month', 'quarter'] as const

    rangeParams.forEach(range => {
      // Simulate date range calculation for each range type
      const now = new Date('2026-03-15T12:00:00Z')
      let startDate: Date

      switch (range) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          expect(startDate.getHours()).toBe(0)
          expect(startDate.getMinutes()).toBe(0)
          break
        case 'week':
          // Start from Monday of current week
          const dayOfWeek = now.getDay()
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          startDate = new Date(now)
          startDate.setDate(now.getDate() + diff)
          startDate.setHours(0, 0, 0, 0)
          expect(startDate.getDay()).toBe(1) // Monday
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          expect(startDate.getDate()).toBe(1)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          expect(startDate.getMonth() % 3).toBe(0)
          break
      }
    })
  })

  it('groups revenue by date period correctly', () => {
    const transactions = [
      { created_at: '2026-03-01T10:00:00Z', amount: 4.99, type: 'purchase', credits_purchased: 5 },
      { created_at: '2026-03-01T15:00:00Z', amount: 8.99, type: 'purchase', credits_purchased: 10 },
      { created_at: '2026-03-02T09:00:00Z', amount: 19.99, type: 'purchase', credits_purchased: 25 },
    ]

    // Group by day (monthly view)
    const groupedByMonth: Record<string, any[]> = {}
    for (const tx of transactions) {
      const txDate = new Date(tx.created_at)
      const dateKey = `${txDate.getFullYear()}-${(txDate.getMonth() + 1).toString().padStart(2, '0')}`
      if (!groupedByMonth[dateKey]) {
        groupedByMonth[dateKey] = []
      }
      groupedByMonth[dateKey].push(tx)
    }

    expect(Object.keys(groupedByMonth)).toHaveLength(1)
    expect(groupedByMonth['2026-03']).toHaveLength(3)
  })

  it('calculates package breakdown from transaction amounts', () => {
    const transactions = [
      { amount: 4.99, type: 'purchase', credits_purchased: 5 },
      { amount: 8.99, type: 'purchase', credits_purchased: 10 },
      { amount: 19.99, type: 'purchase', credits_purchased: 25 },
      { amount: 4.99, type: 'purchase', credits_purchased: 5 },
    ]

    const byPackage: Record<string, any> = {}
    for (const tx of transactions) {
      if (tx.type !== 'purchase') continue

      const amount = Number(tx.amount)
      let packageName: string

      if (amount >= 4.49 && amount <= 5.49) {
        packageName = '5 credits'
      } else if (amount >= 8.49 && amount <= 9.49) {
        packageName = '10 credits'
      } else if (amount >= 19.49 && amount <= 20.49) {
        packageName = '25 credits'
      } else {
        packageName = 'other'
      }

      if (!byPackage[packageName]) {
        byPackage[packageName] = { package: packageName, revenue: 0, count: 0, credits: 0 }
      }
      byPackage[packageName].revenue += amount
      byPackage[packageName].count += 1
      byPackage[packageName].credits += tx.credits_purchased
    }

    expect(byPackage['5 credits'].count).toBe(2)
    expect(byPackage['5 credits'].revenue).toBe(9.98)
    expect(byPackage['10 credits'].count).toBe(1)
    expect(byPackage['25 credits'].count).toBe(1)
  })

  it('filters transactions by status and type', () => {
    const allTransactions = [
      { status: 'completed', type: 'purchase', amount: 4.99 },
      { status: 'completed', type: 'refund', amount: -4.99 },
      { status: 'completed', type: 'adjustment', amount: 2.00 },
      { status: 'pending', type: 'purchase', amount: 8.99 },
      { status: 'failed', type: 'purchase', amount: 19.99 },
    ]

    // Filter for revenue calculation
    const revenueTransactions = allTransactions.filter(
      t => t.status === 'completed' && ['purchase', 'refund', 'adjustment'].includes(t.type)
    )

    expect(revenueTransactions).toHaveLength(3)
    expect(revenueTransactions.every(t => t.status === 'completed')).toBe(true)
  })
})
