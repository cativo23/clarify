<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-indigo flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Logo/Title -->
      <div class="text-center mb-8 animate-fade-in">
        <h1 class="text-4xl font-bold text-white mb-2">Clarify</h1>
        <p class="text-primary-200">Análisis inteligente de contratos</p>
      </div>

      <!-- Auth Card -->
      <div class="bg-white rounded-2xl shadow-premium p-8 animate-slide-up">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-primary-900 mb-2">
            {{ isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión' }}
          </h2>
          <p class="text-primary-600">
            {{ isSignUp ? 'Comienza a analizar contratos hoy' : 'Bienvenido de vuelta' }}
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-risk-high/10 border border-risk-high rounded-lg">
          <p class="text-risk-high text-sm">{{ errorMessage }}</p>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4 p-3 bg-risk-low/10 border border-risk-low rounded-lg">
          <p class="text-risk-low text-sm">{{ successMessage }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-primary-700 mb-1">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="tu@email.com"
              class="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-indigo focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-primary-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-indigo focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-accent-indigo text-white py-3 rounded-lg font-semibold hover:bg-accent-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión') }}
          </button>
        </form>

        <!-- Toggle Sign Up / Sign In -->
        <div class="mt-6 text-center">
          <button
            @click="toggleMode"
            class="text-accent-indigo hover:text-accent-purple font-medium transition-colors"
          >
            {{ isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate' }}
          </button>
        </div>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-primary-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-primary-500">o</span>
          </div>
        </div>

        <!-- Social Login (Optional) -->
        <button
          @click="handleGoogleSignIn"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-primary-200 rounded-lg hover:bg-primary-50 transition-all disabled:opacity-50"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span class="text-primary-700 font-medium">Continuar con Google</span>
        </button>

        <!-- Back to Home -->
        <div class="mt-6 text-center">
          <NuxtLink to="/" class="text-primary-600 hover:text-primary-900 text-sm transition-colors">
            ← Volver al inicio
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isSignUp = ref(false)

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard')
  }
})

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  errorMessage.value = ''
  successMessage.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isSignUp.value) {
      // Sign Up
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })

      if (error) throw error

      // Create user profile in database
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            credits: 3, // Give 3 free credits
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }

      successMessage.value = 'Cuenta creada! Por favor verifica tu email.'
    } else {
      // Sign In
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })

      if (error) throw error

      // Redirect handled by watchEffect
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Ocurrió un error. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

const handleGoogleSignIn = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) throw error
  } catch (error: any) {
    errorMessage.value = error.message || 'Error al iniciar sesión con Google'
    loading.value = false
  }
}

useHead({
  title: 'Iniciar Sesión',
})
</script>
