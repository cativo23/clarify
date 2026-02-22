<template>
  <header
    class="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 border-primary-100 dark:border-slate-800 backdrop-blur-xl">
    <div class="px-4 py-4 mx-auto max-w-7xl 2xl:max-w-screen-2xl sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink :to="user ? '/dashboard' : '/'"
            class="flex items-center gap-2 text-2xl font-bold text-primary-900 dark:text-white group">
            <div
              class="flex items-center justify-center w-8 h-8 transition-transform duration-300 rounded-lg bg-secondary group-hover:rotate-12">
              <span class="text-lg text-white">C</span>
            </div>
            Clarify
          </NuxtLink>

          <nav v-if="user" class="items-center hidden gap-6 md:flex">
            <NuxtLink to="/dashboard"
              class="relative font-medium transition-colors text-primary-600 dark:text-slate-400 hover:text-primary-900 dark:hover:text-white group"
              active-class="!text-secondary">
              Dashboard
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink to="/credits"
              class="relative font-medium transition-colors text-primary-600 dark:text-slate-400 hover:text-primary-900 dark:hover:text-white group"
              active-class="!text-secondary">
              Créditos
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink to="/history"
              class="relative font-medium transition-colors text-primary-600 dark:text-slate-400 hover:text-primary-900 dark:hover:text-white group"
              active-class="!text-secondary">
              Historial
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink v-if="isAdmin" to="/admin/analytics"
              class="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-secondary to-accent-indigo text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-secondary/20 hover:scale-105 transition-all ml-2"
              active-class="!shadow-xl">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Admin
            </NuxtLink>
          </nav>

          <!-- Guest Nav -->
          <nav v-else class="items-center hidden gap-6 md:flex">
            <NuxtLink to="/"
              class="relative font-medium transition-colors text-primary-600 dark:text-slate-400 hover:text-primary-900 dark:hover:text-white group">
              Inicio
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink to="/about"
              class="relative font-medium transition-colors text-primary-600 dark:text-slate-400 hover:text-primary-900 dark:hover:text-white group">
              Sobre Nosotros
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </NuxtLink>
            <NuxtLink v-if="$route.path !== '/login'" to="/login"
              class="px-5 py-2 font-bold transition-all border bg-secondary/10 text-secondary border-secondary/20 rounded-xl hover:bg-secondary/20">
              Iniciar Sesión
            </NuxtLink>
          </nav>
        </div>

        <div class="flex items-center gap-4 sm:gap-6">
          <ThemeToggle />

          <!-- Credits -->
          <NuxtLink v-if="user" to="/credits"
            class="items-center hidden gap-2 px-4 py-2 transition-all border sm:flex bg-secondary/10 dark:bg-secondary/20 rounded-xl hover:bg-secondary/20 dark:hover:bg-secondary/30 border-secondary/20 dark:border-secondary/30 group">
            <svg class="w-5 h-5 transition-transform text-secondary group-hover:scale-110" fill="currentColor"
              viewBox="0 0 20 20">
              <path
                d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clip-rule="evenodd" />
            </svg>
            <span class="font-bold text-primary-900 dark:text-white">{{ userCredits }}</span>
          </NuxtLink>

          <!-- User Menu -->
          <div v-if="user" class="relative">
            <button @click.stop="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 px-2 py-2 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <div
                class="flex items-center justify-center font-bold text-white rounded-full shadow-lg w-9 h-9 bg-gradient-to-br from-secondary to-accent-indigo shadow-secondary/20">
                {{ userInitials }}
              </div>
              <svg class="w-4 h-4 transition-transform text-primary-600 dark:text-slate-400"
                :class="{ 'rotate-180': showUserMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown -->
            <div v-if="showUserMenu" v-click-outside="() => showUserMenu = false"
              class="absolute right-0 w-56 py-2 mt-3 overflow-hidden bg-white border dark:bg-slate-900 rounded-2xl shadow-premium border-primary-100 dark:border-slate-800 animate-slide-up backdrop-blur-xl">
              <div class="px-4 py-3 border-b border-primary-50 dark:border-slate-800">
                <p class="mb-1 text-xs font-medium tracking-wider uppercase text-primary-400 dark:text-slate-500">
                  Usuario</p>
                <p class="text-sm font-semibold truncate text-primary-900 dark:text-white">{{ userEmail }}</p>
              </div>

              <div class="p-1">
                <NuxtLink to="/dashboard"
                  class="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors text-primary-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                  @click="showUserMenu = false">
                  <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  Mi Dashboard
                </NuxtLink>

                <NuxtLink to="/credits"
                  class="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors text-primary-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                  @click="showUserMenu = false">
                  <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Comprar Créditos
                </NuxtLink>

                <NuxtLink to="/history"
                  class="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors text-primary-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                  @click="showUserMenu = false">
                  <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Mi Historial
                </NuxtLink>

                <NuxtLink v-if="isAdmin" to="/admin/analytics"
                  class="flex items-center w-full gap-3 px-3 py-2 text-xs font-black text-secondary transition-colors hover:bg-secondary/5 rounded-xl uppercase tracking-widest"
                  @click="showUserMenu = false">
                  <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  Admin Panel
                </NuxtLink>
              </div>

              <div class="p-1 border-t border-primary-50 dark:border-slate-800">
                <button @click="handleSignOut"
                  class="flex items-center w-full gap-3 px-3 py-2 text-sm font-semibold transition-colors text-risk-high hover:bg-risk-high/10 rounded-xl">
                  <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-risk-high/10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
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
const user = useSupabaseUser()
const showUserMenu = ref(false)
const userCredits = useCreditsState()

const userState = useUserState()
const isAdmin = computed(() => {
    return userState.value?.is_admin === true
})

const userInitials = computed(() => {
  const email = user.value?.email || ''
  return email.charAt(0).toUpperCase()
})

const userEmail = computed(() => user.value?.email || '')

const refreshCredits = async () => {
  await fetchUserProfile()
}

const handleSignOut = async () => {
  await signOut()
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
  refreshCredits()
})
</script>
