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

export interface CategoryIndexEntry {
  category: string;
  count: number;
  firstIndex: number;
}

export function groupFindingsByCategory(
  hallazgos: Hallazgo[],
): CategoryIndexEntry[] {
  const entries = new Map<string, CategoryIndexEntry>();
  hallazgos.forEach((hallazgo, index) => {
    const category = hallazgo.categoria_riesgo?.trim();
    if (!category) return;
    const existing = entries.get(category);
    if (existing) {
      existing.count += 1;
    } else {
      entries.set(category, { category, count: 1, firstIndex: index });
    }
  });
  return Array.from(entries.values());
}
