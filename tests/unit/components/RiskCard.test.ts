import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RiskCard from "@/components/RiskCard.vue";
import CertaintyBadge from "@/components/CertaintyBadge.vue";

const baseProps = {
  category: "Renovación automática",
  description: "El contrato se renueva sin aviso previo",
  risk: "high" as const,
};

describe("RiskCard certainty pill", () => {
  it('renders "Confianza Alta" with indigo classes when confianza is Alta', () => {
    const wrapper = mount(RiskCard, {
      props: { ...baseProps, confianza: "Alta" },
    });
    const badge = wrapper.findComponent(CertaintyBadge);
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toContain("Confianza Alta");
    expect(badge.classes()).toContain("bg-accent-indigo/10");
    expect(badge.classes()).toContain("text-accent-indigo");
  });

  it('renders "Confianza Media" with slate classes when confianza is Media', () => {
    const wrapper = mount(RiskCard, {
      props: { ...baseProps, confianza: "Media" },
    });
    const badge = wrapper.findComponent(CertaintyBadge);
    expect(badge.text()).toContain("Confianza Media");
    expect(badge.classes()).toContain("bg-slate-200");
    expect(badge.classes()).toContain("text-slate-600");
  });

  it('renders "Confianza Baja" with outline classes and no bg- class when confianza is Baja', () => {
    const wrapper = mount(RiskCard, {
      props: { ...baseProps, confianza: "Baja" },
    });
    const badge = wrapper.findComponent(CertaintyBadge);
    expect(badge.text()).toContain("Confianza Baja");
    expect(badge.classes()).toContain("border");
    expect(badge.classes()).toContain("border-slate-300");
    expect(badge.classes()).toContain("text-slate-400");
    expect(badge.classes().some((c) => c.startsWith("bg-"))).toBe(false);
  });

  it("renders the badge inline with the title, in the same parent element", () => {
    const wrapper = mount(RiskCard, {
      props: { ...baseProps, confianza: "Alta" },
    });
    const badge = wrapper.findComponent(CertaintyBadge);
    const h3 = wrapper.find("h3");
    expect(badge.element.parentElement).toBe(h3.element.parentElement);
  });

  it("renders no CertaintyBadge and still renders the title when confianza is omitted", () => {
    const wrapper = mount(RiskCard, {
      props: { ...baseProps },
    });
    expect(wrapper.findComponent(CertaintyBadge).exists()).toBe(false);
    expect(wrapper.find("h3").text()).toBe("Renovación automática");
  });

  it("badge root has pill shell classes and exactly one child element (no status dot)", () => {
    const wrapper = mount(RiskCard, {
      props: { ...baseProps, confianza: "Alta" },
    });
    const badge = wrapper.findComponent(CertaintyBadge);
    expect(badge.classes()).toContain("rounded-full");
    expect(badge.classes()).toContain("uppercase");
    expect(badge.classes()).toContain("font-black");
    expect(badge.classes()).toContain("px-2");
    expect(badge.classes()).toContain("py-0.5");
    expect(badge.classes()).toContain("text-[9px]");
    expect(badge.element.children.length).toBe(1);
  });
});
