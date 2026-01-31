// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  experimental: {
    appManifest: false
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxtjs/color-mode',
  ],

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  // Supabase configuration
  supabase: {
    redirect: false,
  },

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (server-side only)
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379'),

    // Public keys (exposed to client)
    public: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    },
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false, // Disabled for performance
  },

  // Dev server configuration
  devServer: {
    port: 3001,
  },


  // App configuration
  app: {
    head: {
      title: 'Clarify - Análisis Inteligente de Contratos',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Traduce contratos complejos a un formato visual tipo semáforo. Entiende qué estás firmando en segundos.'
        },
        { name: 'theme-color', content: '#0f172a' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        },
      ],
    },
  },

  // Nitro configuration for serverless functions
  nitro: {
    preset: 'vercel',
  },

  // Vite configuration for Hot Module Replacement (HMR) in Docker
  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        port: 3001,
      },
      watch: {
        usePolling: true,
      },
    },
  },
})
