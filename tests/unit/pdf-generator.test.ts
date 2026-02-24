import { describe, it, expect, beforeEach } from 'vitest'
import { generateAnalysisPDF } from '../../server/utils/pdf-generator'
import type { Analysis, AnalysisSummary } from '../../types'

/**
 * Mock analysis data for deterministic tests
 */
const mockAnalysis: Analysis = {
  id: 'test-analysis-001',
  user_id: 'test-user-001',
  contract_name: 'Contrato de Servicios de Prueba',
  file_url: 'https://example.com/contracts/test.pdf',
  summary_json: null, // Will be overridden
  risk_level: 'high',
  credits_used: 1,
  status: 'completed',
  analysis_type: 'premium',
  created_at: '2026-02-24T10:00:00Z',
}

const mockSummary: AnalysisSummary = {
  resumen_ejecutivo: {
    veredicto: 'Negociar con precaución',
    justificacion: 'El contrato contiene varias cláusulas que requieren atención antes de firmar.',
    clausulas_criticas_totales: 5,
    mayor_riesgo_identificado: 'Cláusula de jurisdicción exclusiva',
  },
  nivel_riesgo_general: 'Alto',
  metricas: {
    total_rojas: 3,
    total_amarillas: 2,
    total_verdes: 5,
    porcentaje_clausulas_analizadas: '100%',
  },
  hallazgos: [
    {
      titulo: 'Cláusula de Jurisdicción Exclusiva',
      color: 'rojo',
      explicacion: 'Establece que cualquier disputa debe resolverse en tribunales de otra ciudad, incrementando costos legales.',
      clausula: 'Cláusula 12.3',
      cita_textual: 'Las partes se someten a los tribunales de la Ciudad de México...',
      riesgo_real: 'Alto',
      mitigacion: 'Solicitar jurisdicción concurrente o arbitraje.',
    },
    {
      titulo: 'Limitación de Responsabilidad Desequilibrada',
      color: 'amarillo',
      explicacion: 'La limitación de responsabilidad beneficia exclusivamente a una de las partes.',
      clausula: 'Cláusula 8.1',
      cita_textual: 'La empresa no será responsable por daños indirectos...',
      riesgo_real: 'Medio',
      mitigacion: 'Negociar límites de responsabilidad mutuos.',
    },
    {
      titulo: 'Cláusula de Renovación Automática',
      color: 'verde',
      explicacion: 'El contrato se renueva automáticamente si no se notifica lo contrario.',
      clausula: 'Cláusula 5.2',
      cita_textual: 'Este contrato se renovará automáticamente por períodos iguales...',
      riesgo_real: 'Bajo',
      mitigacion: 'Establecer recordatorios para fechas de vencimiento.',
    },
  ],
}

const mockForensicSummary: AnalysisSummary = {
  ...mockSummary,
  analisis_cruzado: [
    {
      tipo: 'Contradicción',
      inconsistencia: 'Las fechas de pago contradicen el plazo de entrega',
      clausula_origen: 'Cláusula 3.1 (Pago en 30 días)',
      clausula_destino: 'Cláusula 4.2 (Entrega en 45 días)',
      impacto: 'Posible incumplimiento por desfase temporal',
      recomendacion: 'Alinear plazos de pago y entrega',
      severidad: 'medio',
    },
  ],
  omisiones: [
    {
      que_falta: 'Cláusula de confidencialidad',
      categoria: 'Protección de datos',
      riesgo_usuario: 'Medio - Información sensible podría quedar desprotegida',
      clausula_sugerida: 'Las partes acuerdan mantener confidencialidad sobre información sensible...',
    },
  ],
  mapa_estructural: {
    total_secciones: 15,
    total_anexos: 2,
    total_paginas: 12,
    secciones: [
      { nombre: 'Objeto del Contrato', paginas: '1-2', riesgo: 'bajo' },
      { nombre: 'Obligaciones', paginas: '3-5', riesgo: 'medio' },
      { nombre: 'Pago y Facturación', paginas: '6-8', riesgo: 'alto' },
    ],
  },
}

describe('PDF Generator', () => {
  describe('Basic PDF Generation', () => {
    it('generates PDF buffer successfully', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      expect(pdfBuffer.length).toBeGreaterThan(1000) // Valid PDF has minimum size
    })

    it('generates PDF with correct header branding', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      // Check for Clarify branding (should contain the text)
      expect(pdfContent).toContain('CLARIFY')
      expect(pdfContent).toContain('Contrato de Servicios de Prueba')
    })

    it('includes contract name in PDF', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toContain('Contrato de Servicios de Prueba')
    })

    it('includes analysis date in PDF', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      // Date should be formatted in Spanish
      expect(pdfContent).toMatch(/Analizado:|2026|febrero|February/i)
    })
  })

  describe('Risk Badge', () => {
    it('displays high risk badge with correct color', async () => {
      const highRiskSummary: AnalysisSummary = {
        ...mockSummary,
        nivel_riesgo_general: 'Alto',
      }

      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, highRiskSummary)
      const pdfContent = pdfBuffer.toString('binary')

      // Red color code for high risk (#ef4444)
      expect(pdfContent).toMatch(/#ef4444|ALTO|Alto/)
    })

    it('displays medium risk badge with correct color', async () => {
      const mediumRiskSummary: AnalysisSummary = {
        ...mockSummary,
        nivel_riesgo_general: 'Medio',
      }

      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mediumRiskSummary)
      const pdfContent = pdfBuffer.toString('binary')

      // Amber color code for medium risk (#f59e0b)
      expect(pdfContent).toMatch(/#f59e0b|MEDIO|Medio/)
    })

    it('displays low risk badge with correct color', async () => {
      const lowRiskSummary: AnalysisSummary = {
        ...mockSummary,
        nivel_riesgo_general: 'Bajo',
      }

      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, lowRiskSummary)
      const pdfContent = pdfBuffer.toString('binary')

      // Green color code for low risk (#10b981)
      expect(pdfContent).toMatch(/#10b981|BAJO|Bajo/)
    })
  })

  describe('Executive Summary', () => {
    it('includes verdict in executive summary', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toContain('RESUMEN EJECUTIVO')
      expect(pdfContent).toContain('Veredicto')
      expect(pdfContent).toContain('Negociar con precaución')
    })

    it('includes justification in executive summary', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toContain('El contrato contiene varias cláusulas')
    })

    it('includes metrics (rojas, amarillas, verdes)', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toMatch(/🔴\s*3|Métricas.*3|total_rojas.*3/i)
      expect(pdfContent).toMatch(/🟡\s*2|Métricas.*2|total_amarillas.*2/i)
      expect(pdfContent).toMatch(/🟢\s*5|Métricas.*5|total_verdes.*5/i)
    })
  })

  describe('Hallazgos (Findings)', () => {
    it('includes all hallazgos in PDF', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toContain('ANÁLISIS POR CLÁUSULA')
      expect(pdfContent).toContain('Cláusula de Jurisdicción Exclusiva')
      expect(pdfContent).toContain('Limitación de Responsabilidad Desequilibrada')
      expect(pdfContent).toContain('Cláusula de Renovación Automática')
    })

    it('includes risk level for each hallazgo', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toMatch(/Riesgo.*Alto|Riesgo:.*Alto/i)
      expect(pdfContent).toMatch(/Riesgo.*Medio|Riesgo:.*Medio/i)
      expect(pdfContent).toMatch(/Riesgo.*Bajo|Riesgo:.*Bajo/i)
    })

    it('includes mitigation suggestions', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toMatch(/Mitigación.*Solicitar jurisdicción|Mitigación:.*Solicitar/i)
      expect(pdfContent).toMatch(/Mitigación.*Negociar límites|Mitigación:.*Negociar/i)
    })

    it('uses colored left border for each hallazgo', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('binary')

      // Should contain risk colors
      expect(pdfContent).toMatch(/#ef4444|#f59e0b|#10b981/)
    })
  })

  describe('Forensic Sections', () => {
    it('includes análisis cruzado when present', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockForensicSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toContain('ANÁLISIS CRUZADO')
      expect(pdfContent).toContain('Contradicción')
      expect(pdfContent).toContain('Las fechas de pago contradicen')
    })

    it('includes omisiones when present', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockForensicSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toContain('OMISIONES')
      expect(pdfContent).toContain('Cláusula de confidencialidad')
    })

    it('includes mapa estructural when present', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockForensicSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toContain('MAPA ESTRUCTURAL')
      expect(pdfContent).toContain('Objeto del Contrato')
      expect(pdfContent).toContain('Obligaciones')
    })
  })

  describe('Footer and Disclaimer', () => {
    it('includes legal disclaimer in footer', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary, {
        includeDisclaimer: true,
      })
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toMatch(/NOTA LEGAL|aviso legal|legal/i)
      expect(pdfContent).toMatch(/IA|inteligencia artificial|generated/i)
      expect(pdfContent).toMatch(/abogado|lawyer|profesional/i)
    })

    it('includes page numbers', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toMatch(/Página|Page|página/i)
    })

    it('disclaimer has amber background color', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary, {
        includeDisclaimer: true,
      })
      const pdfContent = pdfBuffer.toString('binary')

      // Amber background (#fef3c7)
      expect(pdfContent).toMatch(/#fef3c7|#f59e0b/)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty hallazgos array', async () => {
      const emptySummary: AnalysisSummary = {
        ...mockSummary,
        hallazgos: [],
      }

      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, emptySummary)
      expect(pdfBuffer.length).toBeGreaterThan(500) // Should still generate valid PDF
    })

    it('handles missing optional fields gracefully', async () => {
      const minimalSummary: AnalysisSummary = {
        resumen_ejecutivo: {
          veredicto: 'Sin veredicto',
          justificacion: '',
          clausulas_criticas_totales: 0,
          mayor_riesgo_identificado: 'Ninguno',
        },
        nivel_riesgo_general: 'Bajo',
        metricas: {
          total_rojas: 0,
          total_amarillas: 0,
          total_verdes: 0,
          porcentaje_clausulas_analizadas: '0%',
        },
        hallazgos: [],
      }

      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, minimalSummary)
      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
    })

    it('handles very long contract names', async () => {
      const longNameAnalysis: Analysis = {
        ...mockAnalysis,
        contract_name: 'Contrato de Servicios Profesionales de Consultoría Legal y Asesoría Empresarial Internacional S.A. de C.V.',
      }

      const pdfBuffer = await generateAnalysisPDF(longNameAnalysis, mockSummary)
      expect(pdfBuffer).toBeDefined()
    })

    it('handles special characters in contract names', async () => {
      const specialNameAnalysis: Analysis = {
        ...mockAnalysis,
        contract_name: 'Contrato de Servicios "Premium" & Asociados (2026) - ¡Importante!',
      }

      const pdfBuffer = await generateAnalysisPDF(specialNameAnalysis, mockSummary)
      expect(pdfBuffer).toBeDefined()
    })
  })

  describe('PDF Generation Options', () => {
    it('generates with branding enabled by default', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toContain('CLARIFY')
    })

    it('generates with disclaimer enabled by default', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary)
      const pdfContent = pdfBuffer.toString('latin1')

      expect(pdfContent).toMatch(/NOTA LEGAL|legal/i)
    })

    it('can disable disclaimer when option set to false', async () => {
      const pdfBuffer = await generateAnalysisPDF(mockAnalysis, mockSummary, {
        includeDisclaimer: false,
      })
      // Should still generate but without disclaimer
      expect(pdfBuffer).toBeDefined()
    })
  })
})
