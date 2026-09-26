import type { Hallazgo, RiskLevel } from "~/types";

export function findingAnchorId(index: number): string {
  return `hallazgo-${index}`;
}

export function hallazgoColorToRisk(color: Hallazgo["color"]): RiskLevel {
  switch (color) {
    case "rojo":
      return "high";
    case "amarillo":
      return "medium";
    default:
      return "low";
  }
}

export function formatCoverageSentence(porcentaje: string): string {
  const trimmed = porcentaje.trim().replace(/\s*%\s*$/, "");
  return `Este contrato no presentó cláusulas de riesgo detectables. Cobertura del análisis: ${trimmed}%.`;
}
