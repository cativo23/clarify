/**
 * PDF Generator Utility using pdfkit
 *
 * Generates formatted PDF reports for contract analysis results.
 * Uses pdfkit for server-side PDF generation with proper footer handling.
 * Implements footer by leaving space at the bottom of each page and adding
 * footer content just before adding new content that would go to a new page.
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
  rojo: "#ef4444",
  amarillo: "#f59e0b",
  verde: "#10b981",
  gris: "#6b7280",
  alto: "#ef4444",
  medio: "#f59e0b",
  bajo: "#10b981",
} as const;

const CLARIFY_GREEN = "#00dc82";

/**
 * Generate PDF buffer from analysis data
 */
export async function generateAnalysisPDF(
  analysis: Analysis,
  summary: AnalysisSummary,
  options: PDFGenerationOptions = {},
): Promise<Buffer> {
  const { includeBranding = true, includeDisclaimer = true } = options;

  // Create PDF document
  const doc = new PDFDocument({
    margin: 50,
  });

  const chunks: Uint8Array[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  // Constants for page layout
  const PAGE_HEIGHT = 841.89; // A4 height in points
  const FOOTER_HEIGHT = 60; // Space reserved for footer
  const CONTENT_BOTTOM = PAGE_HEIGHT - doc.page.margins.bottom - FOOTER_HEIGHT; // Bottom of content area

  // Add Clarify branding (first page only)
  if (includeBranding) {
    doc.fillColor(CLARIFY_GREEN).fontSize(28).text("CLARIFY", 50, 70);
    doc.moveDown(1);
  }

  // Contract name
  doc.fontSize(16).font("Helvetica-Bold").text(analysis.contract_name || "Contrato Sin Nombre", 50, doc.y);
  doc.font("Helvetica").fontSize(10);

  // Analysis date
  const analysisDate = new Date(analysis.created_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Analizado: ${analysisDate}`, 50, doc.y, { color: "#6b7280" });
  doc.moveDown(1);

  // Separator line
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#e5e7eb");
  doc.moveDown(1);

  // Risk level badge
  const riskLevel = summary.nivel_riesgo_general?.toLowerCase() || "bajo";
  const riskColor = RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.verde;
  const riskLabel = summary.nivel_riesgo_general ||
    (riskLevel === "alto" ? "Alto" : riskLevel === "medio" ? "Medio" : "Bajo");

  doc.fillColor("#6b7280").text("NIVEL DE RIESGO:", 50, doc.y);
  doc.fillColor(riskColor).fontSize(18).text(riskLabel.toUpperCase(), 50, doc.y);
  doc.fillColor("black").fontSize(10); // Reset color
  doc.moveDown(1);

  // Executive summary
  doc.fillColor("#1f2937").font("Helvetica-Bold").fontSize(14).text("RESUMEN EJECUTIVO", 50, doc.y);
  doc.font("Helvetica").fillColor("black").fontSize(10);

  const ejecutivo = summary.resumen_ejecutivo;
  if (ejecutivo) {
    // Verdict
    doc.text([
      { text: "Veredicto: ", bold: true },
      ejecutivo.veredicto || "Sin veredicto",
    ], 50, doc.y);
    doc.moveDown(0.5);

    // Justification
    doc.text(ejecutivo.justificacion || "", 50, doc.y, { color: "#4b5563" });
    doc.moveDown(1);

    // Metrics
    const metricas = summary.metricas;
    if (metricas) {
      doc.text(`Métricas: 🔴 ${metricas.total_rojas || 0}  🟡 ${metricas.total_amarillas || 0}  🟢 ${metricas.total_verdes || 0}`, 50, doc.y);
      doc.moveDown(1);
    }
  }

  // Separator
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#e5e7eb");
  doc.moveDown(1);

  // Hallazgos section
  doc.fillColor("#1f2937").font("Helvetica-Bold").fontSize(14).text("ANÁLISIS POR CLÁUSULA", 50, doc.y);
  doc.font("Helvetica").fillColor("black").fontSize(10);

  const hallazgos = summary.hallazgos || [];
  if (hallazgos.length === 0) {
    doc.text("No se encontraron hallazgos en este análisis.", 50, doc.y, { color: "#9ca3af" });
  } else {
    for (const hallazgo of hallazgos) {
      const color = hallazgo.color || "verde";
      const riskColor = RISK_COLORS[color as keyof typeof RISK_COLORS] || RISK_COLORS.verde;

      // Check if we need a new page before drawing the border
      if (doc.y > CONTENT_BOTTOM) {
        // Add footer to current page before creating a new page
        if (includeDisclaimer) {
          addFooterToPage(doc, PAGE_HEIGHT, FOOTER_HEIGHT, 1, 1); // Placeholder page numbers
        }
        doc.addPage();
      }

      // Draw colored left border for this hallazgo
      doc.save().fillColor(riskColor).rect(50, doc.y, 4, 20).fill().restore();

      // Hallazgo content
      doc.fillColor("#1f2937").font("Helvetica-Bold").fontSize(11).text(hallazgo.titulo || "Sin título", 60, doc.y);
      doc.font("Helvetica").fillColor("black").fontSize(10);

      if (hallazgo.explicacion) {
        doc.text(hallazgo.explicacion, 60, doc.y, { color: "#4b5563" });
      }

      if (hallazgo.clausula) {
        doc.font("Helvetica-Oblique").text(`Cláusula: ${hallazgo.clausula}`, 60, doc.y, { color: "#6b7280" });
        doc.font("Helvetica");
      }

      if (hallazgo.cita_textual) {
        doc.text(`"${hallazgo.cita_textual}"`, 60, doc.y, { color: "#4b5563" });
      }

      if (hallazgo.riesgo_real) {
        doc.fillColor(riskColor).font("Helvetica-Bold").text(`Riesgo: ${hallazgo.riesgo_real}`, 60, doc.y);
        doc.font("Helvetica").fillColor("black");
      }

      if (hallazgo.mitigacion) {
        doc.fillColor("#059669").text(`Mitigación: ${hallazgo.mitigacion}`, 60, doc.y);
        doc.fillColor("black");
      }

      doc.moveDown(1);
    }
  }

  // Handle forensic sections if present
  if (summary.analisis_cruzado || summary.omisiones || summary.mapa_estructural) {
    // Check if we need a new page
    if (doc.y > CONTENT_BOTTOM) {
      if (includeDisclaimer) {
        addFooterToPage(doc, PAGE_HEIGHT, FOOTER_HEIGHT, 1, 1); // Placeholder page numbers
      }
      doc.addPage();
    }

    // Cross analysis
    if (summary.analisis_cruzado && summary.analisis_cruzado.length > 0) {
      doc.fillColor("#4f46e5").font("Helvetica-Bold").fontSize(14).text("ANÁLISIS CRUZADO", 50, doc.y);
      doc.font("Helvetica").fillColor("black").fontSize(10);

      for (const cruce of summary.analisis_cruzado) {
        // Check page boundary
        if (doc.y > CONTENT_BOTTOM) {
          if (includeDisclaimer) {
            addFooterToPage(doc, PAGE_HEIGHT, FOOTER_HEIGHT, 1, 1); // Placeholder page numbers
          }
          doc.addPage();
        }

        const severityColor = cruce.severidad === "alto" ? RISK_COLORS.alto :
                             cruce.severidad === "medio" ? RISK_COLORS.medio : RISK_COLORS.bajo;

        doc.fillColor(severityColor).font("Helvetica-Bold").text(cruce.tipo || "Relación", 50, doc.y);
        doc.font("Helvetica").fillColor("black").text(cruce.inconsistencia || "", 50, doc.y, { color: "#4b5563" });
        doc.text(`${cruce.clausula_origen} ↔ ${cruce.clausula_destino}`, 50, doc.y, { color: "#6b7280" });
        doc.text(cruce.recomendacion || "", 50, doc.y, { color: "#059669" });

        doc.moveDown(1);
      }
    }

    // Omissions
    if (summary.omisiones && summary.omisiones.length > 0) {
      // Check page boundary
      if (doc.y > CONTENT_BOTTOM) {
        if (includeDisclaimer) {
          addFooterToPage(doc, PAGE_HEIGHT, FOOTER_HEIGHT, 1, 1); // Placeholder page numbers
        }
        doc.addPage();
      }

      doc.fillColor("#d97706").font("Helvetica-Bold").fontSize(14).text("OMISIONES", 50, doc.y);
      doc.font("Helvetica").fillColor("black").fontSize(10);

      for (const omision of summary.omisiones) {
        // Check page boundary
        if (doc.y > CONTENT_BOTTOM) {
          if (includeDisclaimer) {
            addFooterToPage(doc, PAGE_HEIGHT, FOOTER_HEIGHT, 1, 1); // Placeholder page numbers
          }
          doc.addPage();
        }

        doc.fillColor("#1f2937").font("Helvetica-Bold").text(omision.que_falta, 50, doc.y);
        doc.font("Helvetica").fillColor("black").text(`Categoría: ${omision.categoria || "No especificada"}`, 50, doc.y, { color: "#6b7280" });
        doc.text(`Riesgo: ${omision.riesgo_usuario || "No especificado"}`, 50, doc.y, { color: "#4b5563" });

        if (omision.clausula_sugerida) {
          doc.font("Helvetica-Oblique").text(`Sugerencia: ${omision.clausula_sugerida}`, 50, doc.y, { color: "#059669" });
          doc.font("Helvetica");
        }

        doc.moveDown(1);
      }
    }

    // Structural map
    if (summary.mapa_estructural) {
      // Check page boundary
      if (doc.y > CONTENT_BOTTOM) {
        if (includeDisclaimer) {
          addFooterToPage(doc, PAGE_HEIGHT, FOOTER_HEIGHT, 1, 1); // Placeholder page numbers
        }
        doc.addPage();
      }

      const mapa = summary.mapa_estructural;
      doc.fillColor("#6b7280").font("Helvetica-Bold").fontSize(14).text("MAPA ESTRUCTURAL DEL DOCUMENTO", 50, doc.y);
      doc.font("Helvetica").fillColor("black").fontSize(10);

      doc.text(`Total secciones: ${mapa.total_secciones} | Anexos: ${mapa.total_anexos} | Páginas: ${mapa.total_paginas || "N/A"}`, 50, doc.y, { color: "#4b5563" });

      if (mapa.secciones && mapa.secciones.length > 0) {
        doc.fillColor("#374151").font("Helvetica-Bold").text("Secciones:", 50, doc.y);
        doc.font("Helvetica").fillColor("black");

        for (const seccion of mapa.secciones) {
          // Check page boundary
          if (doc.y > CONTENT_BOTTOM) {
            if (includeDisclaimer) {
              addFooterToPage(doc, PAGE_HEIGHT, FOOTER_HEIGHT, 1, 1); // Placeholder page numbers
            }
            doc.addPage();
          }

          const riskColor = RISK_COLORS[seccion.riesgo as keyof typeof RISK_COLORS] || RISK_COLORS.gris;
          doc.text(`• ${seccion.nombre} (pág. ${seccion.paginas})`, 50, doc.y, { color: riskColor });
        }
      }
    }
  }

  // Add footer to the last page
  if (includeDisclaimer) {
    // We need to calculate the actual page count, so we'll use a simpler approach
    // For now, add the footer to the current page
    const currentPageNum = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
    const totalPages = currentPageNum; // This is a simplification

    addFooterToPage(doc, PAGE_HEIGHT, FOOTER_HEIGHT, currentPageNum, totalPages);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))));
    doc.on("error", reject);
  });
}

/**
 * Helper function to add footer to a page
 */
function addFooterToPage(doc: PDFDocument, pageHeight: number, footerHeight: number, currentPage: number, totalPages: number) {
  const footerY = pageHeight - footerHeight - doc.page.margins.bottom + 10;

  // Footer background
  doc.rect(50, footerY, 495, 45)
     .fill("#fef3c7")
     .stroke("#f59e0b");

  // Footer content
  doc.fillColor("#92400e").font("Helvetica-Bold").fontSize(8).text("NOTA LEGAL", 55, footerY + 5);
  doc.fillColor("#78350f").font("Helvetica").fontSize(6).text("Este análisis es una guía informativa generada por IA y NO constituye asesoría legal profesional. Para decisiones legales importantes, consulte con un abogado calificado.", 55, footerY + 15);

  // Page number
  doc.fillColor("#6b7280").fontSize(8).text(`Página ${currentPage} de ${totalPages}`, 495, footerY + 30, { align: 'right' });
}