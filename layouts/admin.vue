<template>
  <div v-if="isAdmin" class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
    <!-- Mobile Header -->
    <div class="lg:hidden sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 border-slate-100 dark:border-slate-800 backdrop-blur-xl">
      <div class="px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/dashboard" class="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary">
            <span class="text-sm text-white font-black">C</span>
          </div>
          Clarify
        </NuxtLink>
        <button @click="sidebarOpen = !sidebarOpen" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <svg class="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!sidebarOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside
        :class="[
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-72 transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ]"
      >
        <div class="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
          <!-- Logo -->
          <div class="p-6 border-b border-slate-100 dark:border-slate-800">
            <NuxtLink to="/dashboard" class="flex items-center gap-3 group">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent-indigo shadow-lg shadow-secondary/20 group-hover:scale-105 transition-transform">
                <span class="text-xl text-white font-black">C</span>
              </div>
              <div>
                <p class="text-lg font-black text-slate-900 dark:text-white">Clarify</p>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Panel</p>
              </div>
            </NuxtLink>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
            <NuxtLink
              to="/admin/analytics"
              @click="sidebarOpen = false"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all',
                $route.path === '/admin/analytics'
                  ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/>
                <path d="M13 17V5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/>
                <path d="M8 17v-3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/>
              </svg>
              Analytics
            </NuxtLink>

            <NuxtLink
              to="/admin/config"
              @click="sidebarOpen = false"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all',
                $route.path === '/admin/config' || $route.path.startsWith('/admin/user/')
                  ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Configuración
            </NuxtLink>
          </nav>

          <!-- Sidebar Footer -->
          <div class="p-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
            <!-- Theme Toggle & Help/Links Area -->
            <div class="flex items-center justify-between">
              <ThemeToggle />
              <NuxtLink
                to="/dashboard"
                @click="sidebarOpen = false"
                class="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-secondary transition-colors group"
              >
                <svg class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Dashboard
              </NuxtLink>
            </div>

            <!-- User Profile Card -->
            <div v-if="user" class="relative" v-click-outside="() => showUserMenu = false">
                <button 
                  @click="showUserMenu = !showUserMenu"
                  class="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-secondary/30 transition-all group"
                >
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent-indigo flex items-center justify-center text-white text-sm font-black shadow-lg shadow-secondary/20">
                        {{ userInitials }}
                      </div>
                      <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5">Administrator</p>
                      <p class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ userEmail }}</p>
                    </div>
                    <svg class="w-4 h-4 text-slate-300 group-hover:text-secondary transition-transform" :class="{'rotate-180': showUserMenu}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </button>

                <!-- Dropdown Menu -->
                <div v-if="showUserMenu" class="absolute bottom-full left-0 w-full mb-3 p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl animate-slide-up z-50">
                   <div class="px-3 py-2 border-b border-slate-50 dark:border-slate-800/50 mb-1">
                      <p class="text-[10px] font-bold text-slate-400 truncate">{{ userEmail }}</p>
                   </div>
                   <button @click="handleSignOut" class="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-risk-high hover:bg-risk-high/5 rounded-xl transition-colors">
                      <div class="w-7 h-7 rounded-lg bg-risk-high/10 flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      </div>
                      Cerrar Sesión
                   </button>
                </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Overlay for mobile -->
      <div
        v-if="sidebarOpen"
        @click="sidebarOpen = false"
        class="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
      ></div>

      <!-- Main Content -->
      <main class="flex-1 min-w-0">
        <div class="p-4 sm:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
  <div v-else class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <LoadingSpinner size="xl" />
  </div>
</template>

<script setup lang="ts">
import { vClickOutside } from '~/composables/useClickOutside'

const user = useSupabaseUser()
const sidebarOpen = ref(false)
const showUserMenu = ref(false)

const userState = useUserState()
const isAdmin = computed(() => userState.value?.is_admin === true)

const userInitials = computed(() => {
  const email = user.value?.email || ''
  return email.charAt(0).toUpperCase()
})

const userEmail = computed(() => user.value?.email || '')

const handleSignOut = async () => {
  await signOut()
}
</script>
