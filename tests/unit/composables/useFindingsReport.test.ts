import { describe, it, expect } from "vitest";
import {
  findingAnchorId,
  hallazgoColorToRisk,
  formatCoverageSentence,
} from "@/composables/useFindingsReport";

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
