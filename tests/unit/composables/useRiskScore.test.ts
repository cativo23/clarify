import { describe, it, expect } from "vitest";
import { getScoreRisk, buildBreakdownBars } from "@/composables/useRiskScore";

describe("getScoreRisk", () => {
  it("returns null for undefined", () => {
    expect(getScoreRisk(undefined)).toBeNull();
  });

  it("returns null for NaN", () => {
    expect(getScoreRisk(NaN)).toBeNull();
  });

  it.each([
    [0, 0, "low", "Riesgo Bajo"],
    [2, 2, "low", "Riesgo Bajo"],
    [3, 3, "medium", "Riesgo Medio"],
    [5, 5, "medium", "Riesgo Medio"],
    [6, 6, "high", "Riesgo Alto"],
    [10, 10, "high", "Riesgo Alto"],
    [12, 10, "high", "Riesgo Alto"],
    [-3, 0, "low", "Riesgo Bajo"],
    [6.6, 7, "high", "Riesgo Alto"],
    [2.4, 2, "low", "Riesgo Bajo"],
  ])("score %p -> value %p, level %p, label %p", (input, value, level, label) => {
    expect(getScoreRisk(input as number)).toEqual({ value, level, label });
  });
});

describe("buildBreakdownBars", () => {
  it("returns bars sorted by count desc with relative-to-max widthPct", () => {
    expect(
      buildBreakdownBars({ Financiero: 3, Datos: 2, Responsabilidad: 1 }),
    ).toEqual([
      { category: "Financiero", count: 3, widthPct: 100 },
      { category: "Datos", count: 2, widthPct: 67 },
      { category: "Responsabilidad", count: 1, widthPct: 33 },
    ]);
  });

  it("floors small bars at 6%", () => {
    expect(buildBreakdownBars({ Datos: 1, Financiero: 50 })).toEqual([
      { category: "Financiero", count: 50, widthPct: 100 },
      { category: "Datos", count: 1, widthPct: 6 },
    ]);
  });

  it("returns a single bar with widthPct 100", () => {
    expect(buildBreakdownBars({ Otro: 4 })).toEqual([
      { category: "Otro", count: 4, widthPct: 100 },
    ]);
  });

  it("returns [] for undefined", () => {
    expect(buildBreakdownBars(undefined)).toEqual([]);
  });

  it("returns [] for an empty object", () => {
    expect(buildBreakdownBars({})).toEqual([]);
  });

  it("filters non-positive and non-finite counts", () => {
    expect(buildBreakdownBars({ A: 0, B: -2, C: NaN, D: 2 })).toEqual([
      { category: "D", count: 2, widthPct: 100 },
    ]);
  });

  it("keeps insertion order on ties", () => {
    expect(buildBreakdownBars({ Datos: 2, Financiero: 2 })).toEqual([
      { category: "Datos", count: 2, widthPct: 100 },
      { category: "Financiero", count: 2, widthPct: 100 },
    ]);
  });
});
