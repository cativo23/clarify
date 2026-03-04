import { z } from 'zod';
import { H3Event } from 'h3';

// Rate limiting store - in production this would use Redis
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

export default defineEventHandler(async (event: H3Event) => {
  // Zod validation for contract name
  const bodySchema = z.object({
    contract_name: z.string().min(1).max(255),
    analysis_type: z.enum(['basic', 'premium', 'forensic']).optional().default('premium')
  });

  try {
    const body = await readBody(event);
    const { contract_name, analysis_type } = bodySchema.parse(body);

    // IP-based rate limiting (10 requests per hour)
    const clientIP = getRequestIP(event) || 'unknown';
    const now = Date.now();
    const hour = 60 * 60 * 1000; // 1 hour in ms

    const stored = rateLimitStore.get(clientIP);
    if (!stored || now - stored.timestamp > hour) {
      rateLimitStore.set(clientIP, { count: 1, timestamp: now });
    } else {
      if (stored.count >= 10) {
        throw createError({
          statusCode: 429,
          message: 'Rate limit exceeded. Please try again later.'
        });
      }
      rateLimitStore.set(clientIP, { count: stored.count + 1, timestamp: stored.timestamp });
    }

    // Simulate processing delay to mimic real analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate simulated analysis results
    const riskLevels = ['low', 'medium', 'high'] as const;
    const randomRiskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    const simulatedResults = {
      id: `demo_${Math.random().toString(36).substr(2, 9)}`,
      user_id: 'demo_user',
      file_name: contract_name,
      file_url: '/demo/contract.pdf', // Mock URL
      analysis_type,
      status: 'completed',
      created_at: new Date().toISOString(),
      summary_json: {
        risk_level: randomRiskLevel,
        executive_summary: `Demo analysis of ${contract_name}. This contract presents ${randomRiskLevel} level risks that require attention.`,
        risk_score: Math.floor(Math.random() * 100),
        key_findings: [
          `Contract contains ${Math.floor(Math.random() * 3) + 1} potential areas of concern`,
          'Some clauses may benefit from legal review',
          'Standard terms appear consistent with industry practices'
        ],
        recommendations: [
          'Have a qualified attorney review unusual clauses',
          'Pay particular attention to termination and indemnification sections',
          'Consider negotiating more favorable terms if possible'
        ]
      },
      risk_items: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => ({
        id: `risk_${i}`,
        clause_text: `Sample clause ${i + 1} that might pose some risk or require attention`,
        risk_level: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        category: ['Financial', 'Legal', 'Compliance', 'Operational'][Math.floor(Math.random() * 4)],
        severity: Math.floor(Math.random() * 10) + 1,
        recommendation: `Recommendation for addressing risk item ${i + 1}`
      })),
      key_clauses: Array.from({ length: Math.floor(Math.random() * 4) + 2 }, (_, i) => ({
        id: `clause_${i}`,
        title: `Key Clause ${i + 1}`,
        text: `This is a sample important clause that affects ${['payment terms', 'termination rights', 'liability limits', 'dispute resolution'][i % 4]}`,
        importance: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]
      })),
      pdf_available: false, // No PDF for demo
      tokens_used: 0 // Simulated, no AI used
    };

    // Set header to indicate this is a simulation
    setResponseHeader(event, 'X-Simulation', 'true');

    return {
      success: true,
      data: simulatedResults,
      message: 'Demo analysis completed successfully'
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body: ' + error.errors.map(e => e.message).join(', ')
      });
    }

    throw error;
  }
});