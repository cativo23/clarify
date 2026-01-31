<template>
  <header class="bg-white/80 dark:bg-slate-900/80 border-b border-primary-100 dark:border-slate-800 sticky top-0 z-50 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink to="/dashboard" class="text-2xl font-bold text-primary-900 dark:text-white flex items-center gap-2 group">
            <div class="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <span class="text-white text-lg">C</span>
            </div>
            Clarify
          </NuxtLink>
          
          <nav class="hidden md:flex items-center gap-6">
            <NuxtLink 
              to="/dashboard" 
              class="text-primary-600 dark:text-slate-400 hover:text-primary-900 dark:hover:text-white font-medium transition-colors relative group"
              active-class="!text-secondary"
            >
              Dashboard
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink 
              to="/credits" 
              class="text-primary-600 dark:text-slate-400 hover:text-primary-900 dark:hover:text-white font-medium transition-colors relative group"
              active-class="!text-secondary"
            >
              Créditos
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </NuxtLink>
          </nav>
        </div>

        <div class="flex items-center gap-4 sm:gap-6">
          <ThemeToggle />

          <!-- Credits -->
          <NuxtLink 
            to="/credits"
            class="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary/10 dark:bg-secondary/20 rounded-xl hover:bg-secondary/20 dark:hover:bg-secondary/30 transition-all border border-secondary/20 dark:border-secondary/30 group"
          >
            <svg class="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
            </svg>
            <span class="font-bold text-primary-900 dark:text-white">{{ userCredits }}</span>
          </NuxtLink>

          <!-- User Menu -->
          <div class="relative">
            <button
              @click.stop="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div class="w-9 h-9 bg-gradient-to-br from-secondary to-accent-indigo rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-secondary/20">
                {{ userInitials }}
              </div>
              <svg 
                class="w-4 h-4 text-primary-600 dark:text-slate-400 transition-transform" 
                :class="{ 'rotate-180': showUserMenu }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown -->
            <div
              v-if="showUserMenu"
              v-click-outside="() => showUserMenu = false"
              class="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-primary-100 dark:border-slate-800 py-2 animate-slide-up overflow-hidden backdrop-blur-xl"
            >
              <div class="px-4 py-3 border-b border-primary-50 dark:border-slate-800">
                <p class="text-xs font-medium text-primary-400 dark:text-slate-500 uppercase tracking-wider mb-1">Usuario</p>
                <p class="text-sm font-semibold text-primary-900 dark:text-white truncate">{{ userEmail }}</p>
              </div>
              
              <div class="p-1">
                <NuxtLink 
                  to="/dashboard"
                  class="flex items-center gap-3 w-full px-3 py-2 text-sm text-primary-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  @click="showUserMenu = false"
                >
                  <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  </div>
                  Mi Dashboard
                </NuxtLink>
                
                <NuxtLink 
                  to="/credits"
                  class="flex items-center gap-3 w-full px-3 py-2 text-sm text-primary-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  @click="showUserMenu = false"
                >
                  <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  Comprar Créditos
                </NuxtLink>
              </div>

              <div class="p-1 border-t border-primary-50 dark:border-slate-800">
                <button
                  @click="handleSignOut"
                  class="flex items-center gap-3 w-full px-3 py-2 text-sm text-risk-high hover:bg-risk-high/10 rounded-xl transition-colors font-semibold"
                >
                  <div class="w-8 h-8 rounded-lg bg-risk-high/10 flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  </div>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const showUserMenu = ref(false)
const userCredits = ref(0)

const userInitials = computed(() => {
  const email = user.value?.email || ''
  return email.charAt(0).toUpperCase()
})

const userEmail = computed(() => user.value?.email || '')

const fetchUserCredits = async () => {
  if (!user.value?.id) return
  
  const { data } = await supabase
    .from('users')
    .select('credits')
    .eq('id', user.value.id)
    .single()

  if (data) {
    userCredits.value = data.credits
  }
}

const handleSignOut = async () => {
  await supabase.auth.signOut()
  // Redirect to login page
  navigateTo('/login')
}

// Click outside directive implementation
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}

onMounted(() => {
  fetchUserCredits()
})
</script>
