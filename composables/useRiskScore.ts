import type { RiskLevel } from "~/types";

export interface ScoreRisk {
  value: number;
  level: RiskLevel;
  label: string;
}

export function getScoreRisk(score: number | undefined): ScoreRisk | null {
  if (score === undefined || !Number.isFinite(score)) return null;

  const clamped = Math.min(10, Math.max(0, Math.round(score)));

  if (clamped <= 2)
    return { value: clamped, level: "low", label: "Riesgo Bajo" };
  if (clamped <= 5)
    return { value: clamped, level: "medium", label: "Riesgo Medio" };
  return { value: clamped, level: "high", label: "Riesgo Alto" };
}

export interface BreakdownBar {
  category: string;
  count: number;
  widthPct: number;
}

export function buildBreakdownBars(
  desglose: Record<string, number> | undefined,
): BreakdownBar[] {
  const entries = Object.entries(desglose ?? {}).filter(
    ([, count]) => Number.isFinite(count) && count > 0,
  );
  if (entries.length === 0) return [];

  const sorted = [...entries].sort(([, a], [, b]) => b - a);
  const max = sorted[0]?.[1] ?? 1;

  return sorted.map(([category, count]) => ({
    category,
    count,
    widthPct: Math.min(100, Math.max(6, Math.round((count / max) * 100))),
  }));
}
