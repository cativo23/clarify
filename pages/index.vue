<template>
  <div
    class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500"
  >
    <!-- Hero Section -->
    <section class="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
      <!-- Background Elements -->
      <div class="absolute inset-0 z-0">
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(0,220,130,0.1),transparent_50%)]"
        ></div>
        <div
          class="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05] grayscale"
        ></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium mb-6 animate-fade-in"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-secondary"
              ></span>
            </span>
            Nueva IA de Auditoría Legal v1.0
          </div>

          <h1
            class="text-5xl lg:text-8xl font-black text-slate-900 dark:text-white mb-8 tracking-tight animate-slide-up"
          >
            Entiende lo que estás
            <span
              class="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent-indigo"
            >
              firmando hoy
            </span>
          </h1>

          <p
            class="text-xl lg:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up"
            style="animation-delay: 0.1s"
          >
            Clarify traduce los términos legales complejos en un análisis visual
            intuitivo.
            <span class="text-slate-900 dark:text-slate-200 font-medium"
              >Audita tus contratos en segundos con IA.</span
            >
          </p>

          <!-- CTA Buttons -->
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-slide-up"
            style="animation-delay: 0.2s"
          >
            <NuxtLink
              v-if="!user"
              to="/login"
              class="group relative px-8 py-4 bg-secondary text-white rounded-2xl font-bold text-lg hover:shadow-glow hover:scale-105 transition-all duration-300"
            >
              Comenzar Gratis
              <span
                class="inline-block transform group-hover:translate-x-1 transition-transform ml-2"
                >→</span
              >
            </NuxtLink>
            <NuxtLink
              v-else
              to="/dashboard"
              class="group px-8 py-4 bg-secondary text-white rounded-2xl font-bold text-lg hover:shadow-glow hover:scale-105 transition-all duration-300"
            >
              Ir al Dashboard
              <span
                class="inline-block transform group-hover:translate-x-1 transition-transform ml-2"
                >→</span
              >
            </NuxtLink>
            <button
              class="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
            >
              Ver Demo
            </button>
          </div>

          <!-- Interactive Preview Card -->
          <div
            class="relative max-w-4xl mx-auto animate-slide-up"
            style="animation-delay: 0.3s"
          >
            <div
              class="absolute -inset-1 bg-gradient-to-r from-secondary to-accent-indigo rounded-[2rem] blur opacity-20 dark:opacity-40"
            ></div>
            <div
              class="relative bg-white dark:bg-slate-900 rounded-[1.8rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl overflow-hidden"
            >
              <div class="flex flex-wrap justify-center gap-8 sm:gap-16">
                <div class="flex flex-col items-center group">
                  <div
                    class="w-16 h-16 rounded-2xl bg-risk-low/20 flex items-center justify-center text-risk-low mb-3 ring-1 ring-risk-low/30 group-hover:scale-110 transition-transform duration-500"
                  >
                    <svg
                      class="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    class="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-widest text-xs"
                    >Seguro</span
                  >
                </div>
                <div class="flex flex-col items-center group">
                  <div
                    class="w-16 h-16 rounded-2xl bg-risk-medium/20 flex items-center justify-center text-risk-medium mb-3 ring-1 ring-risk-medium/30 group-hover:scale-110 transition-transform duration-500"
                  >
                    <svg
                      class="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <span
                    class="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-widest text-xs"
                    >Precaución</span
                  >
                </div>
                <div class="flex flex-col items-center group">
                  <div
                    class="w-16 h-16 rounded-2xl bg-risk-high/20 flex items-center justify-center text-risk-high mb-3 ring-1 ring-risk-high/30 group-hover:scale-110 transition-transform duration-500"
                  >
                    <svg
                      class="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <span
                    class="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-widest text-xs"
                    >Crítico</span
                  >
                </div>
              </div>
            </div>
            <!-- Decorative light -->
            <div
              class="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-[60px] animate-pulse-slow"
            ></div>
            <div
              class="absolute -top-10 -right-10 w-40 h-40 bg-accent-indigo/20 rounded-full blur-[60px] animate-pulse-slow"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section
      class="py-24 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-500"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20">
          <h2
            class="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4"
          >
            Auditoría en 3 pasos
          </h2>
          <p class="text-slate-500 dark:text-slate-400 text-lg">
            Tecnología de punta para decisiones inteligentes.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-12">
          <!-- Step 1 -->
          <div class="relative group">
            <div
              class="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-premium transition-all overflow-hidden"
            >
              <div
                class="absolute -top-6 -right-2 text-8xl font-black text-slate-100/50 dark:text-slate-800/20 group-hover:text-secondary/10 transition-all duration-500 pointer-events-none"
              >
                01
              </div>
              <div class="relative z-10">
                <div
                  class="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6"
                >
                  <svg
                    class="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3
                  class="text-2xl font-bold text-slate-900 dark:text-white mb-4"
                >
                  Sube tu Contrato
                </h3>
                <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Arrastra tu PDF o imagen. Usamos encriptación para proteger
                  tus datos.
                </p>
              </div>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="relative group md:mt-8">
            <div
              class="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-premium transition-all overflow-hidden"
            >
              <div
                class="absolute -top-6 -right-2 text-8xl font-black text-slate-100/50 dark:text-slate-800/20 group-hover:text-accent-indigo/10 transition-all duration-500 pointer-events-none"
              >
                02
              </div>
              <div class="relative z-10">
                <div
                  class="w-14 h-14 bg-accent-indigo/10 text-accent-indigo rounded-2xl flex items-center justify-center mb-6"
                >
                  <svg
                    class="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3
                  class="text-2xl font-bold text-slate-900 dark:text-white mb-4"
                >
                  IA Analiza
                </h3>
                <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nuestro motor de IA avanzada audita cada línea buscando
                  cláusulas abusivas y beneficios ocultos.
                </p>
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="relative group">
            <div
              class="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-premium transition-all overflow-hidden"
            >
              <div
                class="absolute -top-6 -right-2 text-8xl font-black text-slate-100/50 dark:text-slate-800/20 group-hover:text-emerald-500/10 transition-all duration-500 pointer-events-none"
              >
                03
              </div>
              <div class="relative z-10">
                <div
                  class="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"
                >
                  <svg
                    class="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3
                  class="text-2xl font-bold text-slate-900 dark:text-white mb-4"
                >
                  Resultados Claros
                </h3>
                <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Visualiza el nivel de riesgo y entiende los puntos críticos en
                  términos sencillos. Sin rodeos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section
      class="py-24 bg-white dark:bg-slate-950 transition-colors duration-500"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              class="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-8 leading-tight"
            >
              ¿Por qué confiar en <span class="text-secondary">Clarify</span>?
            </h2>
            <div class="space-y-8">
              <div class="flex gap-6">
                <div
                  class="flex-shrink-0 w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center font-bold text-slate-400"
                >
                  01
                </div>
                <div>
                  <h3
                    class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                  >
                    IA Especializada
                  </h3>
                  <p class="text-slate-500 dark:text-slate-400">
                    Motor de IA especializado en análisis de documentos para una
                    interpretación clara y precisa.
                  </p>
                </div>
              </div>
              <div class="flex gap-6">
                <div
                  class="flex-shrink-0 w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center font-bold text-slate-400"
                >
                  02
                </div>
                <div>
                  <h3
                    class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                  >
                    Privacidad Extrema
                  </h3>
                  <p class="text-slate-500 dark:text-slate-400">
                    Tus datos nunca se usan para entrenar modelos. Lo que es
                    tuyo, se queda contigo.
                  </p>
                </div>
              </div>
              <div class="flex gap-6">
                <div
                  class="flex-shrink-0 w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center font-bold text-slate-400"
                >
                  03
                </div>
                <div>
                  <h3
                    class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                  >
                    Sin Suscripciones
                  </h3>
                  <p class="text-slate-500 dark:text-slate-400">
                    Paga solo por lo que necesites. Crétidos flexibles que nunca
                    vencen.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="relative">
            <div
              class="aspect-square bg-gradient-to-br from-secondary/20 to-accent-indigo/20 rounded-[3rem] overflow-hidden flex items-center justify-center"
            >
              <!-- Placeholder for illustrative graphic or Image -->
              <div
                class="w-2/3 h-2/3 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-float"
              >
                <div
                  class="w-1/2 h-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4"
                ></div>
                <div
                  class="w-full h-2 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-2"
                ></div>
                <div
                  class="w-full h-2 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-2"
                ></div>
                <div
                  class="w-3/4 h-2 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-8"
                ></div>
                <div
                  class="p-4 rounded-2xl bg-risk-high/10 border border-risk-high/20 mb-4"
                >
                  <div
                    class="w-1/3 h-3 bg-risk-high/20 rounded-full mb-2"
                  ></div>
                  <div class="w-full h-2 bg-risk-high/10 rounded-full"></div>
                </div>
                <div
                  class="p-4 rounded-2xl bg-risk-low/10 border border-risk-low/20"
                >
                  <div class="w-1/4 h-3 bg-risk-low/20 rounded-full mb-2"></div>
                  <div class="w-full h-2 bg-risk-low/10 rounded-full"></div>
                </div>
              </div>
            </div>
            <!-- Decorative dots -->
            <div
              class="absolute top-0 right-0 -mt-4 -mr-4 text-secondary opacity-40"
            >
              <svg
                width="100"
                height="100"
                fill="currentColor"
                viewBox="0 0 100 100"
              >
                <circle cx="10" cy="10" r="2" />
                <circle cx="30" cy="10" r="2" />
                <circle cx="50" cy="10" r="2" />
                <circle cx="70" cy="10" r="2" />
                <circle cx="90" cy="10" r="2" />
                <circle cx="10" cy="30" r="2" />
                <circle cx="30" cy="30" r="2" />
                <circle cx="50" cy="30" r="2" />
                <circle cx="70" cy="30" r="2" />
                <circle cx="90" cy="30" r="2" />
                <circle cx="10" cy="50" r="2" />
                <circle cx="30" cy="50" r="2" />
                <circle cx="50" cy="50" r="2" />
                <circle cx="70" cy="50" r="2" />
                <circle cx="90" cy="50" r="2" />
                <circle cx="10" cy="70" r="2" />
                <circle cx="30" cy="70" r="2" />
                <circle cx="50" cy="70" r="2" />
                <circle cx="70" cy="70" r="2" />
                <circle cx="90" cy="70" r="2" />
                <circle cx="10" cy="90" r="2" />
                <circle cx="30" cy="90" r="2" />
                <circle cx="50" cy="90" r="2" />
                <circle cx="70" cy="90" r="2" />
                <circle cx="90" cy="90" r="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="py-24 relative overflow-hidden">
      <div class="absolute inset-0 bg-slate-950">
        <div
          class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_100%,rgba(0,220,130,0.2),transparent_50%)]"
        ></div>
      </div>

      <div
        class="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8"
      >
        <h2 class="text-4xl lg:text-6xl font-black text-white mb-8">
          No vuelvas a firmar a ciegas.
        </h2>
        <p class="text-xl text-slate-400 mb-12">
          Únete a la nueva era de transparencia legal impulsada por IA.
        </p>
        <NuxtLink
          v-if="!user"
          to="/login"
          class="inline-block px-12 py-5 bg-secondary text-white rounded-[2rem] font-black text-xl hover:shadow-glow hover:scale-105 transition-all duration-300 transform"
        >
          Empezar Ahora - Gratis
        </NuxtLink>
        <NuxtLink
          v-else
          to="/dashboard"
          class="inline-block px-12 py-5 bg-secondary text-white rounded-[2rem] font-black text-xl hover:shadow-glow hover:scale-105 transition-all duration-300 transform"
        >
          Ir a mi Dashboard
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser();

useHead({
  title: "Inicio",
});
</script>
