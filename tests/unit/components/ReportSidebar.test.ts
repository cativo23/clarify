import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import ReportSidebar from "@/components/analysis/ReportSidebar.vue";
import type { CategoryIndexEntry } from "@/composables/useFindingsReport";

const entries: CategoryIndexEntry[] = [
  { category: "Financiero", count: 2, firstIndex: 0 },
  { category: "Datos", count: 2, firstIndex: 1 },
  { category: "Responsabilidad", count: 1, firstIndex: 3 },
];

describe("ReportSidebar", () => {
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollIntoViewMock = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    document.getElementById("hallazgo-0")?.remove();
    document.getElementById("hallazgo-1")?.remove();
    const el0 = document.createElement("div");
    el0.id = "hallazgo-0";
    const el1 = document.createElement("div");
    el1.id = "hallazgo-1";
    document.body.appendChild(el0);
    document.body.appendChild(el1);
  });

  afterEach(() => {
    document.getElementById("hallazgo-0")?.remove();
    document.getElementById("hallazgo-1")?.remove();
    vi.restoreAllMocks();
  });

  it('renders a nav with aria-label "Índice de secciones" and heading "Secciones"', () => {
    const wrapper = mount(ReportSidebar, { props: { entries } });
    const nav = wrapper.find('nav[aria-label="Índice de secciones"]');
    expect(nav.exists()).toBe(true);
    expect(wrapper.text()).toContain("Secciones");
  });

  it("renders one button per entry with the expected labels in order", () => {
    const wrapper = mount(ReportSidebar, { props: { entries } });
    const buttons = wrapper.findAll('button[type="button"]');
    expect(buttons.length).toBe(3);
    expect(buttons[0]?.text()).toBe("Financiero (2)");
    expect(buttons[1]?.text()).toBe("Datos (2)");
    expect(buttons[2]?.text()).toBe("Responsabilidad (1)");
  });

  it('clicking "Datos (2)" scrolls hallazgo-1 with smooth/start', async () => {
    const wrapper = mount(ReportSidebar, {
      props: { entries },
      attachTo: document.body,
    });
    const buttons = wrapper.findAll('button[type="button"]');
    await buttons[1]?.trigger("click");
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock.mock.contexts[0]).toBe(
      document.getElementById("hallazgo-1"),
    );
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    wrapper.unmount();
  });

  it("clicking an entry whose target does not exist calls scrollIntoView zero times", async () => {
    const wrapper = mount(ReportSidebar, {
      props: { entries },
      attachTo: document.body,
    });
    const buttons = wrapper.findAll('button[type="button"]');
    await expect(buttons[2]?.trigger("click")).resolves.not.toThrow();
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(0);
    wrapper.unmount();
  });
});
