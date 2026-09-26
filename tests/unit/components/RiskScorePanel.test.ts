import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RiskScorePanel from "@/components/analysis/RiskScorePanel.vue";

const baseProps = {
  totalRojas: 2,
  totalAmarillas: 3,
  totalVerdes: 4,
  coverage: "96%",
};

describe("RiskScorePanel score and risk label", () => {
  it("renders 7, /10 and Riesgo Alto with text-risk-high on the label and text-[48px] on the number", () => {
    const wrapper = mount(RiskScorePanel, {
      props: { ...baseProps, puntajeRiesgo: 7 },
    });
    expect(wrapper.text()).toContain("7");
    expect(wrapper.text()).toContain("/10");
    expect(wrapper.text()).toContain("Riesgo Alto");
    const label = wrapper.findAll("*").find((el) => el.text() === "Riesgo Alto");
    expect(label?.classes()).toContain("text-risk-high");
    const number = wrapper.find(".text-\\[48px\\]");
    expect(number.exists()).toBe(true);
    expect(number.text()).toBe("7");
  });

  it("renders Riesgo Medio with text-risk-medium for puntajeRiesgo 4", () => {
    const wrapper = mount(RiskScorePanel, {
      props: { ...baseProps, puntajeRiesgo: 4 },
    });
    const label = wrapper
      .findAll("*")
      .find((el) => el.text() === "Riesgo Medio");
    expect(label?.classes()).toContain("text-risk-medium");
  });

  it("renders Riesgo Bajo with text-risk-low for puntajeRiesgo 1", () => {
    const wrapper = mount(RiskScorePanel, {
      props: { ...baseProps, puntajeRiesgo: 1 },
    });
    const label = wrapper
      .findAll("*")
      .find((el) => el.text() === "Riesgo Bajo");
    expect(label?.classes()).toContain("text-risk-low");
  });

  it("renders no score number and no risk label when puntajeRiesgo is undefined, while pills and Cobertura still render", () => {
    const wrapper = mount(RiskScorePanel, { props: { ...baseProps } });
    expect(wrapper.find(".text-\\[48px\\]").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Riesgo");
    expect(wrapper.text()).toContain("Críticos");
    expect(wrapper.text()).toContain("Cobertura");
  });
});

describe("RiskScorePanel severity pills", () => {
  it("renders Críticos, Alertas and Seguros pills with the given totals", () => {
    const wrapper = mount(RiskScorePanel, {
      props: { ...baseProps, puntajeRiesgo: 7 },
    });
    const criticos = wrapper
      .findAll("li")
      .find((li) => li.text().includes("Críticos"));
    expect(criticos?.text()).toContain("2");
    expect(criticos?.classes()).toContain("bg-risk-high/10");

    const alertas = wrapper
      .findAll("li")
      .find((li) => li.text().includes("Alertas"));
    expect(alertas?.text()).toContain("3");
    expect(alertas?.classes()).toContain("bg-risk-medium/10");

    const seguros = wrapper
      .findAll("li")
      .find((li) => li.text().includes("Seguros"));
    expect(seguros?.text()).toContain("4");
    expect(seguros?.classes()).toContain("bg-risk-low/10");
  });
});

describe("RiskScorePanel coverage", () => {
  it("renders Cobertura label and the coverage value verbatim in a text-secondary element", () => {
    const wrapper = mount(RiskScorePanel, {
      props: { ...baseProps, puntajeRiesgo: 7 },
    });
    expect(wrapper.text()).toContain("Cobertura");
    const value = wrapper
      .findAll("*")
      .find((el) => el.text() === "96%" && el.classes().includes("text-secondary"));
    expect(value).toBeTruthy();
  });
});

describe("RiskScorePanel root chrome", () => {
  it("keeps bg-slate-900, rounded-3xl and border-slate-800 on the root element", () => {
    const wrapper = mount(RiskScorePanel, {
      props: { ...baseProps, puntajeRiesgo: 7 },
    });
    expect(wrapper.classes()).toContain("bg-slate-900");
    expect(wrapper.classes()).toContain("rounded-3xl");
    expect(wrapper.classes()).toContain("border-slate-800");
  });
});
