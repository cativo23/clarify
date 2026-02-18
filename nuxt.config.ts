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
    'nuxt-security'
  ],

  // [SECURITY FIX #6] Tighten CSP using nuxt-security with environment awareness
  security: {
    // Nonce is great for prod but can break HMR in some dev environments
    nonce: process.env.NODE_ENV === 'production',
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "https://js.stripe.com",
          "https://challenges.cloudflare.com",
          // Allow unsafe scripts ONLY in development for HMR and hydration
          ...(process.env.NODE_ENV !== 'production' ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'", // Required for Nuxt/Tailwind runtime styles
          "https://fonts.googleapis.com"
        ],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'img-src': ["'self'", "data:", "https:"],
        'connect-src': [
          "'self'",
          "wss://*.supabase.co",
          "https://*.supabase.co",
          "https://api.openai.com",
          "https://api.stripe.com"
        ],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"]
      },
      // Relax COEP in dev to prevent loading issues with some local assets
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? 'require-corp' : 'unsafe-none'
    }
  },

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
    // [SECURITY FIX M3] Redis configuration with Upstash support (auth + TLS)
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379'),
    redisToken: process.env.REDIS_TOKEN || '', // Upstash authentication token
    redisTlsEnabled: !!process.env.REDIS_TOKEN, // Enable TLS for Upstash
    adminEmail: process.env.ADMIN_EMAIL || '',

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
        { name: 'theme-color', content: '#0f172a' }
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
    // [SECURITY FIX L7] Enhanced security headers at server level
    routeRules: {
      '/**': {
        headers: {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
          // Note: Standard security headers (CSP, XSS, Frame, etc) are now managed by nuxt-security
        }
      }
    }
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
