<template>
  <div class="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-500">
    <!-- Background Decor -->
    <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div class="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-secondary/5 rounded-full blur-[120px]"></div>
      <div class="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent-indigo/5 rounded-full blur-[120px]"></div>
    </div>
    <div class="max-w-md w-full">
      <!-- Logo/Title -->
      <div class="text-center mb-8 animate-fade-in">
        <h1 class="text-4xl font-bold text-white mb-2">Clarify</h1>
        <p class="text-primary-200">Análisis inteligente de contratos</p>
      </div>

      <!-- Auth Card -->
      <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-premium p-10 animate-slide-up relative z-10 border border-slate-100 dark:border-slate-800">
        <div class="mb-10 text-center">
          <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-2">
            {{ isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión' }}
          </h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium">
            {{ isSignUp ? 'Comienza a analizar contratos hoy.' : 'Bienvenido de vuelta a Clarify.' }}
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
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="tu@email.com"
              class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Contraseña
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary text-slate-900 dark:text-white transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-secondary text-white py-4 rounded-2xl font-black text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <LoadingSpinner v-if="loading" size="sm" color="white" />
            {{ loading ? 'Procesando...' : (isSignUp ? 'Empezar ahora' : 'Ingresar') }}
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
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-100 dark:border-slate-800"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400">
            <span class="px-6 bg-white dark:bg-slate-900">o</span>
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
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      })

      if (error) throw error

      // Check if email confirmation is required
      if (data.user?.identities?.length === 0) {
        errorMessage.value = 'Este email ya está registrado. Por favor inicia sesión.'
        return
      }

      successMessage.value = '¡Cuenta creada! Por favor verifica tu email antes de iniciar sesión.'
      email.value = ''
      password.value = ''
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
    // Handle email verification error
    if (error.message?.includes('Email not confirmed') || 
        error.message?.includes('verify')) {
      errorMessage.value = 'Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
    } else {
      errorMessage.value = error.message || 'Ocurrió un error. Intenta nuevamente.'
    }
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
