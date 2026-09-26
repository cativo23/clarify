import { describe, it, expect } from "vitest";
import {
  findingAnchorId,
  hallazgoColorToRisk,
  formatCoverageSentence,
  groupFindingsByCategory,
} from "@/composables/useFindingsReport";
import type { Hallazgo } from "@/types";

describe("findingAnchorId", () => {
  it("returns hallazgo-0 for index 0", () => {
    expect(findingAnchorId(0)).toBe("hallazgo-0");
  });

  it("returns hallazgo-12 for index 12", () => {
    expect(findingAnchorId(12)).toBe("hallazgo-12");
  });
});

describe("hallazgoColorToRisk", () => {
  it("maps rojo to high", () => {
    expect(hallazgoColorToRisk("rojo")).toBe("high");
  });

  it("maps amarillo to medium", () => {
    expect(hallazgoColorToRisk("amarillo")).toBe("medium");
  });

  it("maps verde to low", () => {
    expect(hallazgoColorToRisk("verde")).toBe("low");
  });

  it("maps gris to low", () => {
    expect(hallazgoColorToRisk("gris")).toBe("low");
  });
});

describe("formatCoverageSentence", () => {
  it('formats "96%" exactly', () => {
    expect(formatCoverageSentence("96%")).toBe(
      "Este contrato no presentó cláusulas de riesgo detectables. Cobertura del análisis: 96%.",
    );
  });

  it('formats "96" (no percent sign) the same as "96%"', () => {
    expect(formatCoverageSentence("96")).toBe(
      "Este contrato no presentó cláusulas de riesgo detectables. Cobertura del análisis: 96%.",
    );
  });

  it('trims whitespace around the number and percent sign: " 80 % "', () => {
    expect(formatCoverageSentence(" 80 % ")).toMatch(
      /Cobertura del análisis: 80%\.$/,
    );
  });
});

function makeHallazgo(
  color: Hallazgo["color"],
  categoria_riesgo?: string,
): Hallazgo {
  return {
    color,
    titulo: "Título",
    explicacion: "Explicación",
    categoria_riesgo,
  };
}

describe("groupFindingsByCategory", () => {
  it("groups by first-appearance order with counts across colors", () => {
    const hallazgos = [
      makeHallazgo("rojo", "Financiero"),
      makeHallazgo("rojo", "Datos"),
      makeHallazgo("amarillo", "Financiero"),
      makeHallazgo("amarillo", "Responsabilidad"),
      makeHallazgo("verde", "Datos"),
    ];
    expect(groupFindingsByCategory(hallazgos)).toEqual([
      { category: "Financiero", count: 2, firstIndex: 0 },
      { category: "Datos", count: 2, firstIndex: 1 },
      { category: "Responsabilidad", count: 1, firstIndex: 3 },
    ]);
  });

  it("skips findings whose categoria_riesgo is undefined or whitespace-only, keeping other firstIndex positions", () => {
    const hallazgos = [
      makeHallazgo("rojo", undefined),
      makeHallazgo("rojo", "Financiero"),
      makeHallazgo("amarillo", "   "),
      makeHallazgo("verde", "Financiero"),
    ];
    expect(groupFindingsByCategory(hallazgos)).toEqual([
      { category: "Financiero", count: 2, firstIndex: 1 },
    ]);
  });

  it('trims categoria_riesgo " Datos " and groups it with "Datos"', () => {
    const hallazgos = [
      makeHallazgo("rojo", " Datos "),
      makeHallazgo("verde", "Datos"),
    ];
    expect(groupFindingsByCategory(hallazgos)).toEqual([
      { category: "Datos", count: 2, firstIndex: 0 },
    ]);
  });

  it("returns [] for an empty array", () => {
    expect(groupFindingsByCategory([])).toEqual([]);
  });
});
