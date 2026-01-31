/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Brand colors
                primary: {
                    DEFAULT: '#0f172a', // Midnight Blue
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                secondary: {
                    DEFAULT: '#00dc82', // Nuxt Green
                    50: '#effef6',
                    100: '#d7fee9',
                    200: '#b2fcd6',
                    300: '#79f8ba',
                    400: '#3bed98',
                    500: '#00dc82',
                    600: '#00af67',
                    700: '#008a54',
                    800: '#066d45',
                    900: '#075a3b',
                    950: '#033222',
                },
                // Traffic light colors
                risk: {
                    low: '#10b981',    // Green
                    medium: '#f59e0b', // Amber
                    high: '#ef4444',   // Red
                },
                // Accent colors
                accent: {
                    indigo: '#6366f1',
                    purple: '#a855f7',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif', 'system-ui'],
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'glow': '0 0 20px -5px rgba(0, 220, 130, 0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            },
        },
    },
    plugins: [],
}
