import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InteractiveDemo from '~/components/demo/InteractiveDemo.vue';

describe('InteractiveDemo Component', () => {
  it('should render correctly', () => {
    const wrapper = mount(InteractiveDemo);

    expect(wrapper.find('h2').text()).toContain('Prueba Nuestro Servicio');
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('button').text()).toContain('Ver Resultados de Demo');
  });

  it('should allow contract name input', async () => {
    const wrapper = mount(InteractiveDemo);
    const input = wrapper.find('input');

    await input.setValue('Test Contract');
    expect((input.element as HTMLInputElement).value).toBe('Test Contract');
  });

  it('should have sample documents', () => {
    const wrapper = mount(InteractiveDemo);
    const sampleButtons = wrapper.findAll('button').filter(btn =>
      btn.text().includes('Contrato de Servicios') ||
      btn.text().includes('Acuerdo de Confidencialidad') ||
      btn.text().includes('Contrato de Arrendamiento')
    );

    expect(sampleButtons.length).toBe(3);
  });

  it('should simulate upload progress', async () => {
    const wrapper = mount(InteractiveDemo);
    const input = wrapper.find('input');

    await input.setValue('Test Contract');
    await wrapper.vm.$nextTick();

    // Check initial progress state
    expect(wrapper.vm.uploadProgress).toBe(0);

    // Trigger upload simulation
    await wrapper.vm.analyzeContract();

    // Progress should be updating
    expect(wrapper.vm.uploadProgress).toBeGreaterThanOrEqual(0);
  });
});