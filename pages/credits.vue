<template>
  <div class="min-h-screen bg-primary-50">
    <AppHeader />

    <!-- Main Content -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center mb-8 animate-fade-in">
        <h1 class="text-4xl font-bold text-primary-900 mb-4">Compra Créditos</h1>
        <p class="text-xl text-primary-600">
          Selecciona el paquete que mejor se adapte a tus necesidades
        </p>
      </div>

      <!-- Credits Balance -->
      <div class="bg-gradient-to-r from-accent-indigo to-accent-purple rounded-2xl p-8 text-center text-white mb-12 shadow-premium animate-slide-up">
        <p class="text-lg mb-2 opacity-90">Créditos Disponibles</p>
        <p class="text-6xl font-bold mb-2">{{ userCredits }}</p>
        <p class="opacity-75">Un crédito = Un análisis de contrato</p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-3 gap-8 mb-12">
        <div
          v-for="pack in creditPackages"
          :key="pack.id"
          :class="[
            'bg-white rounded-2xl p-8 border-2 transition-all cursor-pointer relative',
            pack.popular 
              ? 'border-accent-indigo shadow-premium scale-105' 
              : 'border-primary-200 hover:border-accent-indigo hover:shadow-soft'
          ]"
          @click="selectPackage(pack)"
        >
          <!-- Popular Badge -->
          <div 
            v-if="pack.popular"
            class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent-indigo text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg"
          >
            ⭐ Más Popular
          </div>

          <!-- Credits -->
          <div class="text-center mb-6">
            <div class="text-6xl font-bold text-primary-900 mb-2">
              {{ pack.credits }}
            </div>
            <div class="text-primary-600 font-medium">créditos</div>
          </div>

          <!-- Price -->
          <div class="text-center mb-6">
            <div class="text-4xl font-bold text-accent-indigo mb-1">
              ${{ pack.price.toFixed(2) }}
            </div>
            <div class="text-primary-500 text-sm">
              ~${{ (pack.price / pack.credits).toFixed(2) }} por análisis
            </div>
          </div>

          <!-- Features -->
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-primary-700">
              <svg class="w-5 h-5 text-risk-low" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Análisis con IA</span>
            </li>
            <li class="flex items-center gap-2 text-primary-700">
              <svg class="w-5 h-5 text-risk-low" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Resultados al instante</span>
            </li>
            <li class="flex items-center gap-2 text-primary-700">
              <svg class="w-5 h-5 text-risk-low" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Sin vencimiento</span>
            </li>
          </ul>

          <!-- CTA Button -->
          <button
            @click="handlePurchase(pack)"
            :disabled="purchasing"
            :class="[
              'w-full py-4 rounded-lg font-bold text-lg transition-all',
              pack.popular
                ? 'bg-accent-indigo text-white hover:bg-accent-purple'
                : 'bg-primary-900 text-white hover:bg-primary-800'
            ]"
          >
            {{ purchasing ? 'Procesando...' : 'Comprar Ahora' }}
          </button>
        </div>
      </div>

      <!-- Payment Info -->
      <div class="bg-white rounded-xl p-8 border border-primary-200">
        <h3 class="text-xl font-bold text-primary-900 mb-4">Métodos de Pago</h3>
        <div class="flex items-center gap-6 mb-6">
          <div class="flex items-center gap-2">
            <svg class="w-12 h-8" viewBox="0 0 48 32" fill="none">
              <rect width="48" height="32" rx="4" fill="#1434CB"/>
              <path d="M18 16C18 13.2386 20.2386 11 23 11H25C27.7614 11 30 13.2386 30 16C30 18.7614 27.7614 21 25 21H23C20.2386 21 18 18.7614 18 16Z" fill="#EB001B"/>
              <path d="M23 11C20.2386 11 18 13.2386 18 16C18 18.7614 20.2386 21 23 21C25.7614 21 28 18.7614 28 16C28 13.2386 25.7614 11 23 11Z" fill="#F79E1B"/>
            </svg>
            <span class="text-primary-700 font-medium">Visa/Mastercard</span>
          </div>
        </div>
        <p class="text-primary-600 text-sm">
          Procesado de forma segura por <span class="font-semibold">Stripe</span>. 
          Nunca almacenamos tu información de pago.
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-6 p-4 bg-risk-high/10 border border-risk-high rounded-lg">
        <p class="text-risk-high text-sm">{{ error }}</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { loadStripe } from '@stripe/stripe-js'

definePageMeta({
  middleware: 'auth',
})

const config = useRuntimeConfig()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const userCredits = ref(0)
const purchasing = ref(false)
const error = ref('')

const creditPackages = [
  {
    id: 'pack_5',
    credits: 5,
    price: 4.99,
    popular: false,
  },
  {
    id: 'pack_10',
    credits: 10,
    price: 8.99,
    popular: true,
  },
  {
    id: 'pack_25',
    credits: 25,
    price: 19.99,
    popular: false,
  },
]

const fetchUserCredits = async () => {
  if (!user.value) return

  const { data } = await supabase
    .from('users')
    .select('credits')
    .eq('id', user.value.id)
    .single()

  if (data) {
    userCredits.value = data.credits
  }
}

const selectPackage = (pack: any) => {
  // Highlight selected package (optional visual feedback)
  console.log('Selected package:', pack)
}

const handlePurchase = async (pack: any) => {
  purchasing.value = true
  error.value = ''

  try {
    // Initialize Stripe
    const stripe = await loadStripe(config.public.stripePublishableKey)
    
    if (!stripe) {
      throw new Error('Error al cargar Stripe')
    }

    // Create checkout session
    const { data } = await $fetch('/api/stripe/checkout', {
      method: 'POST',
      body: {
        packageId: pack.id,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/credits?payment=cancelled`,
      },
    })

    if (!data?.sessionId) {
      throw new Error('Error al crear sesión de pago')
    }

    // Redirect to Stripe Checkout
    const { error: stripeError } = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    })

    if (stripeError) {
      throw stripeError
    }
  } catch (err: any) {
    error.value = err.message || 'Error al procesar el pago. Intenta nuevamente.'
  } finally {
    purchasing.value = false
  }
}

onMounted(() => {
  fetchUserCredits()
})

useHead({
  title: 'Comprar Créditos',
})
</script>
