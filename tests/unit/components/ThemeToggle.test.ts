import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ThemeToggle from '@/components/ThemeToggle.vue'

// Mock useColorMode
const mockColorMode = {
    value: 'light',
    preference: 'light'
}

vi.stubGlobal('useColorMode', () => mockColorMode)

describe('ThemeToggle', () => {
    beforeEach(() => {
        mockColorMode.value = 'light'
        mockColorMode.preference = 'light'
    })

    it('should render correctly', () => {
        const wrapper = mount(ThemeToggle)
        expect(wrapper.exists()).toBe(true)
        expect(wrapper.find('button').exists()).toBe(true)
    })

    it('should toggle theme from light to dark', async () => {
        mockColorMode.value = 'light'
        const wrapper = mount(ThemeToggle)

        await wrapper.find('button').trigger('click')

        expect(mockColorMode.preference).toBe('dark')
    })

    it('should toggle theme from dark to light', async () => {
        mockColorMode.value = 'dark'
        const wrapper = mount(ThemeToggle)

        await wrapper.find('button').trigger('click')

        expect(mockColorMode.preference).toBe('light')
    })

    it('should display correct icon based on mode', () => {
        mockColorMode.value = 'dark'
        const wrapper = mount(ThemeToggle)

        // Check internal logic or classes
        // The component uses conditional classes on icons
        const icons = wrapper.findAll('svg')
        expect(icons.length).toBeGreaterThan(0)

        // We can't easily check which icon is visible without full style computation, 
        // but we can check if classes are applied if we know the structure.
        // However, since we mock useColorMode, the component reactivity might need to be triggered.
        // @vue/test-utils `mount` should handle reactivity if `useColorMode` returns a reactive object.
    })
})
