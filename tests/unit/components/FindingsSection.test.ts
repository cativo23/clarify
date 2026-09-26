import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FindingsSection from "@/components/analysis/FindingsSection.vue";
import RiskCard from "@/components/RiskCard.vue";
import type { Hallazgo } from "@/types";

const hallazgos: Hallazgo[] = [
  {
    color: "rojo",
    titulo: "Renovación automática",
    explicacion: "El contrato se renueva sin aviso previo",
  },
  {
    color: "amarillo",
    titulo: "Penalización por cancelación",
    explicacion: "Cobra una penalización si cancelás antes de tiempo",
    confianza: "Media",
  },
  {
    color: "verde",
    titulo: "Política de privacidad clara",
    explicacion: "El tratamiento de datos personales está bien explicado",
    cita_textual: "Sus datos serán tratados conforme a la ley 25.326",
  },
];

describe("FindingsSection populated", () => {
  it("renders three RiskCard instances inside hallazgo-{index} anchors in order", () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos, coverage: "96%" },
    });
    const cards = wrapper.findAllComponents(RiskCard);
    expect(cards.length).toBe(3);
    ["hallazgo-0", "hallazgo-1", "hallazgo-2"].forEach((id) => {
      const el = wrapper.find(`#${id}`);
      expect(el.exists()).toBe(true);
      expect(el.classes()).toContain("scroll-mt-24");
    });
  });

  it("maps rojo/amarillo/verde to the expected risk labels", () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos, coverage: "96%" },
    });
    expect(wrapper.text()).toContain("Riesgo Alto");
    expect(wrapper.text()).toContain("Precaución");
    expect(wrapper.text()).toContain("Seguro");
  });

  it("passes confianza through to render Confianza Media", () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos, coverage: "96%" },
    });
    expect(wrapper.text()).toContain("Confianza Media");
  });

  it("passes cita_textual through so the quote shows without any click", () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos, coverage: "96%" },
    });
    expect(wrapper.text()).toContain(
      "Sus datos serán tratados conforme a la ley 25.326",
    );
  });

  it('renders the "Análisis por Cláusula" heading', () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos, coverage: "96%" },
    });
    expect(wrapper.text()).toContain("Análisis por Cláusula");
  });
});

describe("FindingsSection empty state", () => {
  it("renders the empty-state heading and sentence with zero RiskCard instances", () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos: [], coverage: "96%" },
    });
    expect(wrapper.text()).toContain("Sin hallazgos de riesgo");
    expect(wrapper.text()).toContain(
      "Este contrato no presentó cláusulas de riesgo detectables. Cobertura del análisis: 96%.",
    );
    expect(wrapper.text()).not.toContain("96%%");
    expect(wrapper.findAllComponents(RiskCard).length).toBe(0);
  });
});
