<template>
  <div
    class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500"
  >
    <!-- Main Content -->
    <main class="max-w-5xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center mb-12 animate-fade-in">
        <h1
          class="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4"
        >
          Compra Créditos
        </h1>
        <p class="text-xl text-slate-500 dark:text-slate-400">
          Selecciona el paquete que mejor se adapte a tus necesidades. Sin
          suscripciones.
        </p>
      </div>

      <!-- Credits Balance -->
      <div
        class="relative bg-gradient-to-br from-secondary to-accent-indigo rounded-[2.5rem] p-10 text-center text-white mb-16 shadow-premium overflow-hidden animate-slide-up"
      >
        <div
          class="absolute inset-0 bg-[url('/grid.svg')] opacity-10 grayscale"
        ></div>
        <p class="text-lg mb-2 opacity-90 relative z-10 font-medium">
          Créditos Disponibles
        </p>
        <p class="text-7xl font-black mb-2 relative z-10">{{ userCredits }}</p>
        <p class="opacity-80 relative z-10 text-sm tracking-widest uppercase">
          Un crédito = Un análisis
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-3 gap-8 mb-12">
        <div
          v-for="pack in creditPackages"
          :key="pack.id"
          :class="[
            'bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 transition-all cursor-pointer relative group',
            pack.popular
              ? 'border-secondary shadow-glow scale-105 z-10'
              : 'border-slate-100 dark:border-slate-800 hover:border-secondary/50 hover:shadow-premium',
          ]"
          @click="selectPackage(pack)"
        >
          <!-- Popular Badge -->
          <div
            v-if="pack.popular"
            class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-secondary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
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
            <div class="text-4xl font-black text-secondary mb-1">
              ${{ pack.price.toFixed(2) }}
            </div>
            <div
              class="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider"
            >
              ~${{ (pack.price / pack.credits).toFixed(2) }} por análisis
            </div>
          </div>

          <!-- Features -->
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-primary-700">
              <svg
                class="w-5 h-5 text-risk-low"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Análisis con IA</span>
            </li>
            <li class="flex items-center gap-2 text-primary-700">
              <svg
                class="w-5 h-5 text-risk-low"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Resultados al instante</span>
            </li>
            <li class="flex items-center gap-2 text-primary-700">
              <svg
                class="w-5 h-5 text-risk-low"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Sin vencimiento</span>
            </li>
          </ul>

          <!-- CTA Button -->
          <button
            :disabled="purchasing"
            :class="[
              'w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3',
              pack.popular
                ? 'bg-accent-indigo text-white hover:bg-accent-purple'
                : 'bg-primary-900 text-white hover:bg-primary-800',
            ]"
            @click="handlePurchase(pack)"
          >
            <LoadingSpinner v-if="purchasing" size="sm" color="white" />
            {{ purchasing ? "Procesando..." : "Comprar Ahora" }}
          </button>
        </div>
      </div>

      <!-- Payment Info -->
      <div
        class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-soft"
      >
        <h3 class="text-xl font-black text-slate-900 dark:text-white mb-6">
          Métodos de Pago
        </h3>
        <div class="flex items-center gap-6 mb-8">
          <div class="flex items-center gap-3">
            <div
              class="w-14 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700"
            >
              <svg class="w-10 h-6" viewBox="0 0 48 32" fill="none">
                <rect width="48" height="32" rx="4" fill="#1434CB" />
                <path
                  d="M18 16C18 13.2386 20.2386 11 23 11H25C27.7614 11 30 13.2386 30 16C30 18.7614 27.7614 21 25 21H23C20.2386 21 18 18.7614 18 16Z"
                  fill="#EB001B"
                />
                <path
                  d="M23 11C20.2386 11 18 13.2386 18 16C18 18.7614 20.2386 21 23 21C25.7614 21 28 18.7614 28 16C28 13.2386 25.7614 11 23 11Z"
                  fill="#F79E1B"
                />
              </svg>
            </div>
            <span class="text-slate-600 dark:text-slate-300 font-bold"
              >Visa / Mastercard</span
            >
          </div>
        </div>
        <div
          class="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4"
        >
          <svg
            class="w-6 h-6 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Procesado de forma segura por
            <span class="font-bold text-slate-900 dark:text-white">Stripe</span
            >. Nunca almacenamos tu información de pago.
          </p>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mt-6 p-4 bg-risk-high/10 border border-risk-high rounded-lg"
      >
        <p class="text-risk-high text-sm">{{ error }}</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { loadStripe } from "@stripe/stripe-js";

definePageMeta({
  middleware: "auth",
});

const config = useRuntimeConfig();
const supabase = useSupabaseClient();

const userCredits = ref(0);
const purchasing = ref(false);
const error = ref("");

const creditPackages = [
  {
    id: "pack_5",
    credits: 5,
    price: 4.99,
    popular: false,
  },
  {
    id: "pack_10",
    credits: 10,
    price: 8.99,
    popular: true,
  },
  {
    id: "pack_25",
    credits: 25,
    price: 19.99,
    popular: false,
  },
];

const fetchUserCredits = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  const { data } = await supabase
    .from("users")
    .select("credits")
    .eq("id", session.user.id)
    .single();

  if (data) {
    userCredits.value = data.credits;
  }
};

const selectPackage = (pack: any) => {
  // Highlight selected package (optional visual feedback)
  console.log("Selected package:", pack);
};

const handlePurchase = async (pack: any) => {
  purchasing.value = true;
  error.value = "";

  try {
    // Initialize Stripe
    const stripe = await loadStripe(config.public.stripePublishableKey);

    if (!stripe) {
      throw new Error("Error al cargar Stripe");
    }

    // Create checkout session
    // Note: Redirect URLs are now constructed server-side for security (C3 fix)
    const { data } = await $fetch("/api/stripe/checkout", {
      method: "POST",
      body: {
        packageId: pack.id,
      },
    });

    if (!data?.sessionUrl) {
      throw new Error("Error al crear sesión de pago");
    }

    // Redirect to Stripe Checkout
    window.location.href = data.sessionUrl;
  } catch (err: any) {
    error.value =
      err.message || "Error al procesar el pago. Intenta nuevamente.";
  } finally {
    purchasing.value = false;
  }
};

onMounted(() => {
  fetchUserCredits();
});

useHead({
  title: "Comprar Créditos",
});
</script>
