import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

  it("renders no nav with aria-label Índice de secciones", () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos: [], coverage: "96%" },
    });
    expect(wrapper.find('nav[aria-label="Índice de secciones"]').exists()).toBe(
      false,
    );
  });
});

describe("FindingsSection category index integration", () => {
  const categorized: Hallazgo[] = [
    {
      color: "rojo",
      titulo: "Financiero 1",
      explicacion: "desc",
      categoria_riesgo: "Financiero",
    },
    {
      color: "rojo",
      titulo: "Datos 1",
      explicacion: "desc",
      categoria_riesgo: "Datos",
    },
    {
      color: "amarillo",
      titulo: "Financiero 2",
      explicacion: "desc",
      categoria_riesgo: "Financiero",
    },
    {
      color: "amarillo",
      titulo: "Responsabilidad 1",
      explicacion: "desc",
      categoria_riesgo: "Responsabilidad",
    },
    {
      color: "verde",
      titulo: "Datos 2",
      explicacion: "desc",
      categoria_riesgo: "Datos",
    },
  ];

  let scrollIntoViewMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollIntoViewMock = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders index labels Financiero (2), Datos (2), Responsabilidad (1) in order", () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos: categorized, coverage: "96%" },
      attachTo: document.body,
    });
    const buttons = wrapper.findAll('button[type="button"]');
    expect(buttons.map((b) => b.text())).toEqual([
      "Financiero (2)",
      "Datos (2)",
      "Responsabilidad (1)",
    ]);
    wrapper.unmount();
  });

  it('clicking "Responsabilidad (1)" scrolls to and focuses hallazgo-3', async () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos: categorized, coverage: "96%" },
      attachTo: document.body,
    });
    const buttons = wrapper.findAll('button[type="button"]');
    const target = wrapper.find("#hallazgo-3");
    await buttons[2]?.trigger("click");
    expect(scrollIntoViewMock.mock.contexts[0]).toBe(target.element);
    expect(document.activeElement).toBe(target.element);
    wrapper.unmount();
  });

  it('every card wrapper has tabindex="-1"', () => {
    const wrapper = mount(FindingsSection, {
      props: { hallazgos: categorized, coverage: "96%" },
    });
    ["hallazgo-0", "hallazgo-1", "hallazgo-2", "hallazgo-3", "hallazgo-4"].forEach(
      (id) => {
        expect(wrapper.find(`#${id}`).attributes("tabindex")).toBe("-1");
      },
    );
  });

  it("hallazgos with no categoria_riesgo render cards, no index, and no lg:grid-cols wrapper", () => {
    const uncategorized: Hallazgo[] = [
      { color: "rojo", titulo: "Sin categoría", explicacion: "desc" },
    ];
    const wrapper = mount(FindingsSection, {
      props: { hallazgos: uncategorized, coverage: "96%" },
    });
    expect(wrapper.find('nav[aria-label="Índice de secciones"]').exists()).toBe(
      false,
    );
    expect(wrapper.findAllComponents(RiskCard).length).toBe(1);
    expect(wrapper.html()).not.toContain("lg:grid-cols-");
  });
});
