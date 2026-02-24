/**
 * PDF Generator Utility
 *
 * Generates formatted PDF reports for contract analysis results.
 * Uses pdfkit for server-side PDF generation with A4 page size and proper margins.
 */

import PDFDocument from "pdfkit";
import type { Analysis, AnalysisSummary } from "~/types";

interface PDFGenerationOptions {
  includeBranding?: boolean;
  includeDisclaimer?: boolean;
}

/**
 * Risk level color mapping
 */
const RISK_COLORS = {
  rojo: "#ef4444", // Red - High risk
  amarillo: "#f59e0b", // Amber - Medium risk
  verde: "#10b981", // Green - Low risk
  gris: "#6b7280", // Gray - Unknown/No risk
  alto: "#ef4444",
  medio: "#f59e0b",
  bajo: "#10b981",
} as const;

const CLARIFY_GREEN = "#00dc82";

/**
 * Generate PDF buffer from analysis data
 *
 * @param analysis - Analysis record from database
 * @param summary - Parsed analysis summary JSON
 * @param options - PDF generation options
 * @returns Promise resolving to PDF buffer
 */
export async function generateAnalysisPDF(
  analysis: Analysis,
  summary: AnalysisSummary,
  options: PDFGenerationOptions = {},
): Promise<Buffer> {
  const { includeBranding = true, includeDisclaimer = true } = options;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    // Create PDF document with A4 size and margins
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Handle chunked data
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Generate header
    generateHeader(doc, analysis, includeBranding);

    // Generate risk badge
    generateRiskBadge(doc, summary);

    // Generate executive summary
    generateExecutiveSummary(doc, summary);

    // Generate findings (hallazgos)
    generateHallazgos(doc, summary);

    // Generate forensic sections if present
    if (
      analysis.analysis_type === "forensic" ||
      analysis.analysis_type === "premium"
    ) {
      generateForensicSections(doc, summary);
    }

    // Add disclaimer and page numbers
    if (includeDisclaimer) {
      generateFooter(doc);
    }

    doc.end();
  });
}

/**
 * Generate header with Clarify branding
 */
function generateHeader(
  doc: PDFKit.PDFDocument,
  analysis: Analysis,
  includeBranding: boolean,
): void {
  const { left } = doc.page.margins;
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  if (includeBranding) {
    // Clarify logo text in secondary green
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor(CLARIFY_GREEN)
      .text("CLARIFY", left, doc.y, { align: "left" });
  }

  doc.moveDown(1.5);

  // Contract name
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#1f2937")
    .text(analysis.contract_name || "Contrato Sin Nombre", left, doc.y, {
      width: pageWidth,
      align: "left",
    });

  doc.moveDown(0.5);

  // Analysis date
  const analysisDate = new Date(analysis.created_at).toLocaleDateString(
    "es-ES",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#6b7280")
    .text(`Analizado: ${analysisDate}`, left, doc.y, {
      width: pageWidth,
      align: "left",
    });

  doc.moveDown(1);

  // Separator line
  const y = doc.y;
  doc
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .moveTo(left, y)
    .lineTo(left + pageWidth, y)
    .stroke();

  doc.moveDown(1.5);
}

/**
 * Generate risk level badge
 */
function generateRiskBadge(doc: PDFKit.PDFDocument, summary: AnalysisSummary) {
  const { left } = doc.page.margins;
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Map risk level to color
  const riskLevel = summary.nivel_riesgo_general?.toLowerCase() || "bajo";
  const riskColor =
    RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.verde;

  const riskLabel =
    summary.nivel_riesgo_general ||
    (riskLevel === "alto" ? "Alto" : riskLevel === "medio" ? "Medio" : "Bajo");

  // Risk badge title
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#6b7280")
    .text("NIVEL DE RIESGO:", left, doc.y, {
      width: pageWidth,
      align: "left",
    });

  doc.moveDown(0.3);

  // Risk level with color
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor(riskColor)
    .text(riskLabel.toUpperCase(), left, doc.y, {
      width: pageWidth,
      align: "left",
    });

  doc.moveDown(1.5);
}

/**
 * Generate executive summary section
 */
function generateExecutiveSummary(
  doc: PDFKit.PDFDocument,
  summary: AnalysisSummary,
) {
  const { left } = doc.page.margins;
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Section title
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#1f2937")
    .text("RESUMEN EJECUTIVO", left, doc.y, {
      width: pageWidth,
      align: "left",
    })
    .moveDown(0.5);

  const ejecutivo = summary.resumen_ejecutivo;

  if (ejecutivo) {
    // Verdict
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text(`Veredicto:`, left, doc.y, {
        width: pageWidth,
        align: "left",
      });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#1f2937")
      .text(ejecutivo.veredicto || "Sin veredicto", left + 70, doc.y - 12, {
        width: pageWidth - 70,
        align: "left",
      });

    doc.moveDown(0.5);

    // Justification
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#4b5563")
      .text(ejecutivo.justificacion || "", left, doc.y, {
        width: pageWidth,
        align: "justify",
      });

    doc.moveDown(0.5);

    // Metrics
    const metricas = summary.metricas;
    if (metricas) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#374151")
        .text(
          `Métricas: 🔴 ${metricas.total_rojas || 0}  🟡 ${metricas.total_amarillas || 0}  🟢 ${metricas.total_verdes || 0}`,
          left,
          doc.y,
          {
            width: pageWidth,
            align: "left",
          },
        );
    }
  }

  doc.moveDown(1.5);

  // Separator
  const y = doc.y;
  doc
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .moveTo(left, y)
    .lineTo(left + pageWidth, y)
    .stroke();

  doc.moveDown(1);
}

/**
 * Generate findings (hallazgos) section
 */
function generateHallazgos(doc: PDFKit.PDFDocument, summary: AnalysisSummary) {
  const { left } = doc.page.margins;
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Section title
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#1f2937")
    .text("ANÁLISIS POR CLÁUSULA", left, doc.y, {
      width: pageWidth,
      align: "left",
    })
    .moveDown(0.5);

  const hallazgos = summary.hallazgos || [];

  if (hallazgos.length === 0) {
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#6b7280")
      .text("No se encontraron hallazgos en este análisis.", left, doc.y, {
        width: pageWidth,
        align: "left",
      });
    doc.moveDown(1.5);
    return;
  }

  for (const hallazgo of hallazgos) {
    const color = hallazgo.color || "verde";
    const riskColor =
      RISK_COLORS[color as keyof typeof RISK_COLORS] || RISK_COLORS.verde;

    // Save position for left border
    const startY = doc.y;

    // Draw colored left border
    doc
      .fillColor(riskColor)
      .rect(left - 3, startY, 3, 50)
      .fill();

    // Title with risk indicator
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#1f2937")
      .text(hallazgo.titulo || "Sin título", left + 10, startY, {
        width: pageWidth - 10,
        align: "left",
      });

    doc.moveDown(0.3);

    // Explanation
    if (hallazgo.explicacion) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#4b5563")
        .text(hallazgo.explicacion, left + 10, doc.y, {
          width: pageWidth - 10,
          align: "justify",
        });
    }

    // Clause reference
    if (hallazgo.clausula) {
      doc.moveDown(0.2);
      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .fillColor("#6b7280")
        .text(`Cláusula: ${hallazgo.clausula}`, left + 10, doc.y, {
          width: pageWidth - 10,
          align: "left",
        });
    }

    // Quote
    if (hallazgo.cita_textual) {
      doc.moveDown(0.2);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#4b5563")
        .text(`"${hallazgo.cita_textual}"`, left + 10, doc.y, {
          width: pageWidth - 10,
          align: "left",
        });
    }

    // Risk
    if (hallazgo.riesgo_real) {
      doc.moveDown(0.2);
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(riskColor)
        .text(`Riesgo: ${hallazgo.riesgo_real}`, left + 10, doc.y, {
          width: pageWidth - 10,
          align: "left",
        });
    }

    // Mitigation
    if (hallazgo.mitigacion) {
      doc.moveDown(0.2);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#059669")
        .text(`Mitigación: ${hallazgo.mitigacion}`, left + 10, doc.y, {
          width: pageWidth - 10,
          align: "justify",
        });
    }

    doc.moveDown(0.5);

    // Check if we need a page break
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
      // Re-apply margins after page break
      doc.y = 50;
    }
  }

  doc.moveDown(1);

  // Separator before forensic sections
  const y = doc.y;
  doc
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .moveTo(left, y)
    .lineTo(left + pageWidth, y)
    .stroke();

  doc.moveDown(1.5);
}

/**
 * Generate forensic-specific sections
 */
function generateForensicSections(
  doc: PDFKit.PDFDocument,
  summary: AnalysisSummary,
) {
  const { left } = doc.page.margins;
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Análisis Cruzado (Cross-Clause Analysis)
  if (summary.analisis_cruzado && summary.analisis_cruzado.length > 0) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#4f46e5") // Indigo for forensic sections
      .text("ANÁLISIS CRUZADO DE CLÁUSULAS", left, doc.y, {
        width: pageWidth,
        align: "left",
      })
      .moveDown(0.5);

    for (const item of summary.analisis_cruzado) {
      const severityColor =
        RISK_COLORS[item.severidad as keyof typeof RISK_COLORS] ||
        RISK_COLORS.gris;

      // Title with severity indicator
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(severityColor)
        .text(`[${item.tipo}] ${item.inconsistencia}`, left, doc.y, {
          width: pageWidth,
          align: "left",
        });

      doc.moveDown(0.3);

      // Details
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#4b5563")
        .text(`Origen: ${item.clausula_origen}`, left, doc.y, {
          width: pageWidth,
          align: "left",
        });

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#4b5563")
        .text(`Destino: ${item.clausula_destino}`, left, doc.y, {
          width: pageWidth,
          align: "left",
        });

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#4b5563")
        .text(`Impacto: ${item.impacto}`, left, doc.y, {
          width: pageWidth,
          align: "justify",
        });

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#059669")
        .text(`Recomendación: ${item.recomendacion}`, left, doc.y, {
          width: pageWidth,
          align: "justify",
        });

      doc.moveDown(0.5);

      if (doc.y > doc.page.height - 100) {
        doc.addPage();
        doc.y = 50;
      }
    }

    doc.moveDown(1);
  }

  // Omisiones (Missing Critical Clauses)
  if (summary.omisiones && summary.omisiones.length > 0) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#d97706") // Amber for omissions
      .text("OMISIONES CRÍTICAS", left, doc.y, {
        width: pageWidth,
        align: "left",
      })
      .moveDown(0.5);

    for (const omision of summary.omisiones) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#1f2937")
        .text(omision.que_falta, left, doc.y, {
          width: pageWidth,
          align: "left",
        });

      doc.moveDown(0.3);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#4b5563")
        .text(`Categoría: ${omision.categoria}`, left, doc.y, {
          width: pageWidth,
          align: "left",
        });

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#ef4444")
        .text(`Riesgo: ${omision.riesgo_usuario}`, left, doc.y, {
          width: pageWidth,
          align: "justify",
        });

      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .fillColor("#059669")
        .text(`Sugerencia: ${omision.clausula_sugerida}`, left, doc.y, {
          width: pageWidth,
          align: "justify",
        });

      doc.moveDown(0.5);

      if (doc.y > doc.page.height - 100) {
        doc.addPage();
        doc.y = 50;
      }
    }

    doc.moveDown(1);
  }

  // Mapa Estructural (Structural Map)
  if (summary.mapa_estructural) {
    const mapa = summary.mapa_estructural;

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#6b7280") // Slate for structural info
      .text("MAPA ESTRUCTURAL DEL DOCUMENTO", left, doc.y, {
        width: pageWidth,
        align: "left",
      })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#4b5563")
      .text(
        `Total secciones: ${mapa.total_secciones} | Anexos: ${mapa.total_anexos} | Páginas: ${mapa.total_paginas || "N/A"}`,
        left,
        doc.y,
        {
          width: pageWidth,
          align: "left",
        },
      );

    doc.moveDown(0.5);

    // Section list
    if (mapa.secciones && mapa.secciones.length > 0) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#374151")
        .text("Secciones:", left, doc.y, {
          width: pageWidth,
          align: "left",
        });

      doc.moveDown(0.3);

      for (const seccion of mapa.secciones) {
        const riskColor =
          RISK_COLORS[seccion.riesgo as keyof typeof RISK_COLORS] ||
          RISK_COLORS.gris;

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(riskColor)
          .text(`• ${seccion.nombre} (pág. ${seccion.paginas})`, left, doc.y, {
            width: pageWidth,
            align: "left",
          });

        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          doc.y = 50;
        }
      }
    }

    doc.moveDown(1);
  }
}

/**
 * Generate footer with legal disclaimer
 */
function generateFooter(doc: PDFKit.PDFDocument): void {
  const { left, right } = doc.page.margins;
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageHeight = doc.page.height;

  // Disclaimer box background
  const footerY = pageHeight - 60;
  const footerHeight = 50;

  doc
    .fillColor("#fef3c7") // Light amber background
    .rect(left, footerY, pageWidth, footerHeight)
    .fill();

  // Border
  doc
    .strokeColor("#f59e0b")
    .lineWidth(1)
    .rect(left, footerY, pageWidth, footerHeight)
    .stroke();

  // Disclaimer title
  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor("#92400e")
    .text("⚠️ NOTA LEGAL", left + 10, footerY + 5, {
      width: pageWidth - 20,
      align: "left",
    });

  // Disclaimer text
  doc
    .fontSize(7)
    .font("Helvetica")
    .fillColor("#78350f")
    .text(
      "Este análisis es una guía informativa generada por IA y NO constituye asesoría legal profesional. Para decisiones legales importantes, consulte con un abogado calificado.",
      left + 10,
      footerY + 18,
      {
        width: pageWidth - 20,
        align: "justify",
      },
    );

  // Page number
  const currentPage = doc.page.number;
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#6b7280")
    .text(`Página ${currentPage}`, right - 50, footerY + 35, {
      width: 50,
      align: "right",
    });
}
