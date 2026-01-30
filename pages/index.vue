<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-accent-indigo">
      <div class="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div class="text-center animate-fade-in">
          <h1 class="text-5xl lg:text-7xl font-bold text-white mb-6">
            Entiende qué estás firmando
            <span class="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              en segundos
            </span>
          </h1>
          
          <p class="text-xl lg:text-2xl text-primary-200 mb-12 max-w-3xl mx-auto">
            Traduce contratos legales complejos a un formato visual tipo semáforo. 
            <span class="font-semibold text-white">Simple. Rápido. Seguro.</span>
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <NuxtLink 
              v-if="!user"
              to="/login" 
              class="px-8 py-4 bg-white text-primary-900 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all shadow-premium hover:scale-105"
            >
              Comenzar Gratis
            </NuxtLink>
            <NuxtLink 
              v-else
              to="/dashboard" 
              class="px-8 py-4 bg-white text-primary-900 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all shadow-premium hover:scale-105"
            >
              Ir al Dashboard
            </NuxtLink>
            <button class="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-900 transition-all">
              Ver Demo
            </button>
          </div>

          <!-- Traffic Light Preview -->
          <div class="flex justify-center gap-4">
            <div class="flex flex-col items-center">
              <div class="w-16 h-16 rounded-full bg-risk-low animate-pulse-slow shadow-premium"></div>
              <span class="text-white mt-2 font-medium">Seguro</span>
            </div>
            <div class="flex flex-col items-center">
              <div class="w-16 h-16 rounded-full bg-risk-medium animate-pulse-slow shadow-premium" style="animation-delay: 0.5s"></div>
              <span class="text-white mt-2 font-medium">Precaución</span>
            </div>
            <div class="flex flex-col items-center">
              <div class="w-16 h-16 rounded-full bg-risk-high animate-pulse-slow shadow-premium" style="animation-delay: 1s"></div>
              <span class="text-white mt-2 font-medium">Crítico</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center text-primary-900 mb-16">
          Cómo Funciona
        </h2>
        
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Step 1 -->
          <div class="text-center p-8 rounded-2xl bg-primary-50 hover:shadow-premium transition-all animate-slide-up">
            <div class="w-16 h-16 bg-accent-indigo rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 class="text-xl font-semibold text-primary-900 mb-4">Sube tu Contrato</h3>
            <p class="text-primary-600">
              Arrastra tu PDF o imagen del contrato a nuestra plataforma segura.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="text-center p-8 rounded-2xl bg-primary-50 hover:shadow-premium transition-all animate-slide-up" style="animation-delay: 0.2s">
            <div class="w-16 h-16 bg-accent-indigo rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 class="text-xl font-semibold text-primary-900 mb-4">IA Analiza</h3>
            <p class="text-primary-600">
              Nuestra inteligencia artificial procesa y traduce cada cláusula.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="text-center p-8 rounded-2xl bg-primary-50 hover:shadow-premium transition-all animate-slide-up" style="animation-delay: 0.4s">
            <div class="w-16 h-16 bg-accent-indigo rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 class="text-xl font-semibold text-primary-900 mb-4">Recibe Resultados</h3>
            <p class="text-primary-600">
              Visualiza riesgos en formato semáforo con explicaciones simples.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 bg-primary-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center text-primary-900 mb-16">
          ¿Por qué Clarify?
        </h2>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="bg-white p-6 rounded-xl shadow-soft hover:shadow-premium transition-all">
            <div class="text-3xl mb-4">🎯</div>
            <h3 class="text-xl font-semibold text-primary-900 mb-2">Análisis Instantáneo</h3>
            <p class="text-primary-600">Resultados en segundos, no en horas de lectura.</p>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-soft hover:shadow-premium transition-all">
            <div class="text-3xl mb-4">🧠</div>
            <h3 class="text-xl font-semibold text-primary-900 mb-2">IA Especializada</h3>
            <p class="text-primary-600">Entrenada específicamente en lenguaje legal.</p>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-soft hover:shadow-premium transition-all">
            <div class="text-3xl mb-4">💰</div>
            <h3 class="text-xl font-semibold text-primary-900 mb-2">Paga por Uso</h3>
            <p class="text-primary-600">Solo pagas por los contratos que analizas.</p>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-soft hover:shadow-premium transition-all">
            <div class="text-3xl mb-4">🔒</div>
            <h3 class="text-xl font-semibold text-primary-900 mb-2">100% Seguro</h3>
            <p class="text-primary-600">Tus documentos están encriptados y protegidos.</p>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-soft hover:shadow-premium transition-all">
            <div class="text-3xl mb-4">📱</div>
            <h3 class="text-xl font-semibold text-primary-900 mb-2">Acceso Total</h3>
            <p class="text-primary-600">Revisa tus análisis cuando quieras.</p>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-soft hover:shadow-premium transition-all">
            <div class="text-3xl mb-4">✨</div>
            <h3 class="text-xl font-semibold text-primary-900 mb-2">Interface Simple</h3>
            <p class="text-primary-600">Diseñado para que cualquiera pueda usarlo.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-r from-primary-900 to-accent-indigo">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-white mb-6">
          ¿Listo para entender tus contratos?
        </h2>
        <p class="text-xl text-primary-200 mb-8">
          Únete a miles de usuarios que ya protegen sus decisiones legales.
        </p>
        <NuxtLink 
          v-if="!user"
          to="/login" 
          class="inline-block px-10 py-5 bg-white text-primary-900 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all shadow-premium hover:scale-105"
        >
          Comenzar Ahora - Es Gratis
        </NuxtLink>
        <NuxtLink 
          v-else
          to="/dashboard" 
          class="inline-block px-10 py-5 bg-white text-primary-900 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all shadow-premium hover:scale-105"
        >
          Ir a tu Dashboard
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-primary-900 text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h3 class="text-2xl font-bold mb-4">Clarify</h3>
          <p class="text-primary-300 mb-4">
            Análisis inteligente de contratos para todos
          </p>
          <div class="flex justify-center gap-6 text-primary-400">
            <a href="#" class="hover:text-white transition-colors">Términos</a>
            <a href="#" class="hover:text-white transition-colors">Privacidad</a>
            <a href="#" class="hover:text-white transition-colors">Contacto</a>
          </div>
          <p class="text-primary-500 mt-6 text-sm">
            © 2026 Clarify. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()

useHead({
  title: 'Inicio',
})
</script>
