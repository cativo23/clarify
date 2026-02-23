<template>
  <div
    class="min-h-screen transition-colors duration-500 bg-white dark:bg-slate-950"
  >
    <main
      class="px-4 py-8 mx-auto max-w-7xl 2xl:max-w-screen-2xl sm:px-6 lg:px-8"
    >
      <!-- New Dashboard Layout -->
      <div class="grid gap-8 mb-12 lg:grid-cols-4">
        <!-- Sidebar: User & Quick Stats -->
        <div class="lg:col-span-1">
          <div
            :class="[
              'flex flex-col gap-6',
              'lg:sticky lg:top-24 lg:z-20',
              'max-lg:border-b max-lg:pb-10 max-lg:mb-10 max-lg:border-slate-100 dark:max-lg:border-slate-800',
            ]"
          >
            <!-- ── User Profile Card ── -->
            <div
              class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden"
            >
              <!-- decorative blob -->
              <div
                class="absolute w-24 h-24 -top-4 -right-4 rounded-full bg-secondary/5 blur-2xl pointer-events-none"
              ></div>
              <div class="relative z-10 text-center">
                <!-- ONE avatar only -->
                <div
                  class="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br from-secondary to-accent-indigo rounded-3xl shadow-lg shadow-secondary/20"
                >
                  {{ userProfile?.email?.charAt(0).toUpperCase() || "" }}
                </div>
                <h2
                  class="mb-1 text-xl font-black truncate text-slate-900 dark:text-white"
                >
                  {{ userProfile?.email?.split("@")[0] || "" }}
                </h2>
                <p
                  class="mb-5 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400"
                >Plan Estándar</p>

                <!-- Credits badge -->
                <div
                  class="flex items-center justify-center gap-2 px-4 py-2 mb-4 bg-secondary/10 border border-secondary/20 rounded-xl"
                >
                  <svg
                    class="w-4 h-4 shrink-0 text-secondary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    />
                  </svg>
                  <span class="text-lg font-black text-secondary">{{
                    userProfile?.credits || 0
                  }}</span>
                  <span
                    class="text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400"
                    >Créditos</span
                  >
                </div>

                <NuxtLink
                  to="/credits"
                  class="block w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-[0.98]"
                >
                  Comprar Más
                </NuxtLink>
              </div>
            </div>

            <!-- ── Security Summary Card ── -->
            <div
              class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden"
            >
              <!-- decorative blob -->
              <div
                class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
              ></div>
              <div class="relative z-10">
                <div class="flex items-center justify-between mb-5">
                  <h3
                    class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]"
                  >Resumen de Seguridad</h3>
                  <span
                    class="px-2 py-0.5 bg-secondary/10 text-secondary text-[8px] font-black uppercase rounded-full border border-secondary/20"
                  >
                    En Vivo
                  </span>
                </div>

                <!-- Safety Score donut -->
                <div class="flex items-center gap-4 mb-5">
                  <div
                    class="relative flex items-center justify-center shrink-0"
                  >
                    <svg class="w-16 h-16 -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        stroke-width="6"
                        fill="transparent"
                        class="text-slate-100 dark:text-slate-800"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        stroke-width="6"
                        fill="transparent"
                        :stroke-dasharray="2 * Math.PI * 28"
                        :stroke-dashoffset="
                          (1 - safetyScore / 100) * (2 * Math.PI * 28)
                        "
                        class="text-secondary transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <span
                      class="absolute text-sm font-black text-slate-900 dark:text-white"
                      >{{ safetyScore }}%</span
                    >
                  </div>
                  <div>
                    <p
                      class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter mb-0.5"
                    >Índice de Protección</p>
                    <p
                      class="text-xs font-black text-slate-900 dark:text-white"
                    >
                      {{
                        safetyScore > 80
                          ? "Seguridad Alta"
                          : safetyScore > 50
                            ? "Seguridad Media"
                            : "Atención Requerida"
                      }}
                    </p>
                  </div>
                </div>

                <!-- Divider label -->
                <p
                  class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3"
                >Indicadores Mensuales</p>

                <!-- Stats -->
                <div
                  class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mb-4"
                >
                  <div>
                    <p
                      class="text-xl font-black text-slate-900 dark:text-white"
                    >
                      {{ totalCriticalFindings }}
                    </p>
                    <p class="text-[9px] font-bold text-slate-500 uppercase">
                      Puntos Críticos
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-xl font-black text-secondary">
                      {{ monthlyActivity }}
                    </p>
                    <p class="text-[9px] font-bold text-slate-500 uppercase">
                      Analizados / Mes
                    </p>
                  </div>
                </div>

                <!-- Last Audit -->
                <div
                  class="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0"
                    ></span>
                    <span
                      class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase"
                      >Última Auditoría</span
                    >
                  </div>
                  <span
                    class="text-[10px] font-black text-slate-900 dark:text-white"
                    >{{ lastAnalysisDate }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Distribution & New Analysis -->
        <div class="space-y-8 lg:col-span-3">
          <!-- Distribution Chart Area -->
          <div
            class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium grid md:grid-cols-2 gap-8 items-center"
          >
            <div>
              <h2
                class="mb-2 text-2xl font-black text-slate-900 dark:text-white"
              >
                Distribución de Riesgos
              </h2>
              <p class="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Panorama general de tus contratos analizados.
              </p>

              <div class="space-y-3">
                <div
                  v-for="risk in riskDistribution"
                  :key="risk.level"
                  class="flex items-center gap-3"
                >
                  <div :class="['w-3 h-3 rounded-full', risk.color]"></div>
                  <span
                    class="flex-1 text-sm font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400"
                    >{{ risk.label }}</span
                  >
                  <span
                    class="text-sm font-black text-slate-900 dark:text-white"
                    >{{ risk.count }}</span
                  >
                </div>
              </div>
            </div>

            <!-- SVG Donut Chart -->
            <div class="relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" class="w-48 h-48 transform -rotate-90">
                <circle
                  v-for="(segment, idx) in chartSegments"
                  :key="idx"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke-width="12"
                  :stroke="segment.stroke"
                  :stroke-dasharray="`${segment.length} 251.2`"
                  :stroke-dashoffset="-segment.offset"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <div
                class="absolute inset-0 flex flex-col items-center justify-center"
              >
                <span
                  class="text-3xl font-black text-slate-900 dark:text-white"
                  >{{ riskDistributionData?.total || 0 }}</span
                >
                <span
                  class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center leading-3"
                  >Contratos<br />Auditados</span
                >
              </div>
            </div>
          </div>

          <!-- New Analysis Section -->
          <div
            class="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-[2.5rem] shadow-premium p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group"
          >
            <div
              class="absolute bottom-0 right-0 w-64 h-64 -mb-32 -mr-32 transition-colors duration-700 rounded-full bg-secondary/5 blur-3xl group-hover:bg-secondary/10"
            ></div>
            <h2
              class="flex items-center gap-3 mb-8 text-2xl font-black text-slate-900 dark:text-white"
            >
              <span
                class="flex items-center justify-center w-10 h-10 bg-secondary/10 rounded-xl text-secondary"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </span>
              Auditar nuevo contrato
            </h2>

            <Dropzone
              v-model="selectedFile"
              class="mb-8"
              @error="handleDropzoneError"
              @uploaded="handleDropzoneUploaded"
              @complete="handleDropzoneComplete"
              @cancel="handleDropzoneCancel"
            />

            <!-- Error Message (Moved outside file check) -->
            <div
              v-if="analyzeError"
              class="p-4 mt-4 border bg-risk-high/10 border-risk-high rounded-2xl animate-shake"
            >
              <p class="text-xs font-bold text-risk-high">
                {{ analyzeError }}
              </p>
            </div>

            <div v-if="selectedFile" class="space-y-8 animate-slide-up">
              <!-- Analysis Type Selector -->
              <div>
                <label
                  class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4"
                >
                  Elige el nivel de protección
                </label>
                <AnalysisSelector
                  v-model="analysisType"
                  :user-credits="userProfile?.credits || 0"
                />
              </div>

              <!-- Contract Name and Action -->
              <div class="flex flex-col gap-4 mb-4 sm:flex-row">
                <input
                  v-model="contractName"
                  type="text"
                  placeholder="Nombre (ej: Contrato Arriendo)"
                  class="flex-1 px-6 py-4 font-bold transition-all bg-white border outline-none dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary text-slate-900 dark:text-white"
                />
                <button
                  :disabled="
                    analyzing ||
                    checkingTokens ||
                    !uploadedFileUrl ||
                    !contractName ||
                    (sharedCredits || 0) < (analysisType === 'forensic' ? 10 : analysisType === 'premium' ? 3 : 1)
                  "
                  class="px-10 py-4 bg-secondary text-white rounded-2xl font-black text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-3"
                  @click="handleAnalyze"
                >
                  <LoadingSpinner
                    v-if="analyzing || checkingTokens"
                    size="sm"
                    color="white"
                  />
                  {{ analyzeButtonText }}
                </button>
              </div>

              <!-- Token Check Info -->
              <div v-if="tokenCheckResult" class="mx-2 mb-6">
                <div
                  :class="[
                    'p-3 rounded-xl border flex items-center justify-between text-xs font-bold',
                    tokenCheckResult.suggestion === analysisType ||
                    tokenCheckResult.fitsInBasic
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200',
                  ]"
                >
                  <div>
                    <span
                      class="block text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5"
                      >Tamaño Documento</span
                    >
                    <span
                      >{{
                        tokenCheckResult.originalTokens.toLocaleString()
                      }}
                      tokens estimados</span
                    >
                  </div>
                  <div class="text-right">
                    <span
                      v-if="
                        !tokenCheckResult.fitsInBasic &&
                        analysisType === 'basic'
                      "
                      class="flex items-center gap-2"
                    >
                      ⚠️ Se recomienda Premium
                    </span>
                    <span
                      v-if="
                        analysisType === 'premium' &&
                        !tokenCheckResult.fitsInPremium
                      "
                      class="flex items-center gap-2 text-red-600"
                    >
                      🚫 Excede límite Premium
                    </span>
                    <span
                      v-if="
                        tokenCheckResult.fitsInBasic && analysisType === 'basic'
                      "
                      class="text-green-600"
                    >
                      ✅ Apto para Basic
                    </span>
                    <span
                      v-if="
                        tokenCheckResult.fitsInPremium &&
                        analysisType === 'premium'
                      "
                      class="text-green-600"
                    >
                      ✅ Apto para Premium
                    </span>
                  </div>
                </div>
              </div>

              <!-- Credit Warnings -->
              <div
                v-if="needsCredits"
                class="flex items-center justify-between gap-4 p-4 border bg-secondary/5 rounded-2xl border-secondary/10 animate-slide-up"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10 text-secondary"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      />
                    </svg>
                  </div>
                  <p
                    class="text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    No tienes créditos suficientes para realizar esta auditoría.
                  </p>
                </div>
                <NuxtLink
                  to="/credits"
                  class="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline whitespace-nowrap"
                >
                  Comprar Créditos
                </NuxtLink>
              </div>

              <div
                v-else-if="needsMoreForPremium"
                class="flex items-center justify-between gap-4 p-4 border bg-secondary/5 rounded-2xl border-secondary/10 animate-slide-up"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10 text-secondary"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      />
                    </svg>
                  </div>
                  <p
                    class="text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    Necesitas 3 créditos para un
                    <span class="text-secondary">Análisis Premium</span>.
                  </p>
                </div>
                <div class="flex items-center gap-4">
                  <button
                    class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    @click="analysisType = 'basic'"
                  >
                    Usar Rápido (1)
                  </button>
                  <NuxtLink
                    to="/credits"
                    class="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline whitespace-nowrap"
                  >
                    Comprar Créditos
                  </NuxtLink>
                </div>
              </div>

              <!-- Forensic Credits Warning -->
              <div
                v-else-if="needsMoreForForensic"
                class="flex items-center justify-between gap-4 p-4 border bg-accent-indigo/5 rounded-2xl border-accent-indigo/10 animate-slide-up"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex items-center justify-center w-8 h-8 rounded-full bg-accent-indigo/10 text-accent-indigo"
                  >
                    <ShieldCheckIcon class="w-4 h-4" />
                  </div>
                  <p
                    class="text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    Necesitas 10 créditos para
                    <span class="text-accent-indigo">Auditoría Forense</span>.
                  </p>
                </div>
                <div class="flex items-center gap-4">
                  <button
                    class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    @click="analysisType = 'premium'"
                  >
                    Usar Premium (3)
                  </button>
                  <NuxtLink
                    to="/credits"
                    class="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline whitespace-nowrap"
                  >
                    Obtener más
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Analyses -->
          <div class="mt-12 mb-12">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-2xl font-black text-slate-900 dark:text-white">
                Análisis Recientes
              </h2>
              <NuxtLink
                v-if="analyses.length > 8"
                to="/history"
                class="text-xs font-black tracking-widest uppercase text-secondary hover:underline"
                >Ver Todo</NuxtLink
              >
            </div>

            <div
              v-if="loading"
              class="grid gap-6 md:grid-cols-2 2xl:grid-cols-4"
            >
              <SkeletonRecentAnalysis v-for="i in 4" :key="i" />
            </div>

            <!-- Empty State: No Analyses -->
            <div
              v-else-if="analyses.length === 0"
              class="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800"
            >
              <div
                class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700"
              >
                <svg
                  class="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3
                class="text-xl font-black text-slate-900 dark:text-white mb-2"
              >
                Aún no has analizado contratos
              </h3>
              <p
                class="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-md mx-auto"
              >
                Comienza analizando tu primer documento para obtener insights
                sobre riesgos legales y cláusulas importantes.
              </p>
              <NuxtLink
                to="/dashboard"
                class="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-white rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-secondary/20"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Analizar mi primer contrato
              </NuxtLink>
            </div>

            <div v-else class="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
              <template v-for="analysis in analyses" :key="analysis.id">
                <NuxtLink
                  v-if="
                    analysis.status === 'completed' ||
                    analysis.status === 'failed'
                  "
                  :to="`/analyze/${analysis.id}`"
                  class="group p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] transition-all flex items-center justify-between hover:border-secondary/50 hover:shadow-premium cursor-pointer"
                >
                  <div class="flex items-center gap-4">
                    <div
                      :class="[
                        'w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110',
                        analysis.status === 'failed'
                          ? 'bg-red-500/10 text-red-500 dark:text-red-400'
                          : getRiskColor(analysis.risk_level),
                      ]"
                    >
                      <!-- Failed status icon -->
                      <svg
                        v-if="analysis.status === 'failed'"
                        class="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <!-- Completed status icons -->
                      <svg
                        v-else-if="
                          analysis.status === 'completed' &&
                          analysis.risk_level === 'high'
                        "
                        class="w-7 h-7"
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
                      <svg
                        v-else-if="
                          analysis.status === 'completed' &&
                          analysis.risk_level === 'medium'
                        "
                        class="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <svg
                        v-else-if="
                          analysis.status === 'completed' &&
                          analysis.risk_level === 'low'
                        "
                        class="w-7 h-7"
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
                      <!-- Processing/pending icons -->
                      <svg
                        v-else
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3
                        class="font-black text-slate-900 dark:text-white group-hover:text-secondary truncate"
                      >
                        {{ analysis.contract_name }}
                      </h3>
                      <div class="flex items-center gap-2">
                        <span
                          class="text-[10px] font-bold text-slate-500 dark:text-slate-400"
                          >{{ timeAgo(analysis.created_at) }}</span
                        >
                        <AnalysisStatusBadge :status="analysis.status" size="sm" />
                      </div>
                    </div>
                  </div>
                </NuxtLink>

                <div
                  v-else
                  class="group p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] transition-all flex items-center justify-between opacity-70 cursor-wait"
                >
                  <div class="flex items-center gap-4">
                    <div
                      class="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    >
                      <span
                        v-if="analysis.status === 'processing'"
                        class="w-6 h-6 border-2 rounded-full border-secondary/30 border-t-secondary animate-spin"
                      ></span>
                      <svg
                        v-else
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3
                        class="font-black text-slate-900 dark:text-white truncate"
                      >
                        {{ analysis.contract_name }}
                      </h3>
                      <div class="flex items-center gap-2">
                        <span
                          class="text-[10px] font-bold text-slate-500 dark:text-slate-400"
                          >{{ timeAgo(analysis.created_at) }}</span
                        >
                        <AnalysisStatusBadge :status="analysis.status" size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Analysis } from "~/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ShieldCheckIcon } from "@heroicons/vue/24/outline";
import { timeAgo } from "~/composables/useTimeAgo";
import { useAnalysisStatus } from "~/composables/useAnalysisStatus";
import AnalysisStatusBadge from "~/components/AnalysisStatusBadge.vue";
import SkeletonRecentAnalysis from "~/components/SkeletonRecentAnalysis.vue";

definePageMeta({
  middleware: "auth",
});

const supabase = useSupabaseClient();
const userState = useUserState();

// Reactive user id for watchers
const currentUserId = ref<string | undefined>(undefined);

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  currentUserId.value = session?.user?.id;
});

const userProfile = ref<any>(null);
const sharedCredits = useCreditsState();
const analyses = ref<Analysis[]>([]);
const loading = ref(true);
const sidebarMetrics = ref<any>(null);
const riskDistributionData = ref<any>(null);

const selectedFile = ref<File | null>(null);
const contractName = ref("");
const analysisType = ref<"basic" | "premium" | "forensic">("premium");
const analyzing = ref(false);
const analyzeError = ref("");

const uploadedFileUrl = ref("");
const tokenCheckResult = ref<any>(null);
const checkingTokens = ref(false);

// Realtime subscription
let realtimeChannel: RealtimeChannel | null = null;

const analyzeButtonText = computed(() => {
  if (analyzing.value) return "Procesando...";
  if (checkingTokens.value) return "Calculando tokens...";
  if (analysisType.value === "forensic") return "Auditoría Forense";
  return analysisType.value === "premium"
    ? "Análisis Completo"
    : "Análisis Rápido";
});

const needsCredits = computed(() => (sharedCredits.value || 0) === 0);
const needsMoreForPremium = computed(
  () =>
    analysisType.value === "premium" &&
    (sharedCredits.value || 0) > 0 &&
    (sharedCredits.value || 0) < 3,
);
const needsMoreForForensic = computed(
  () =>
    analysisType.value === "forensic" &&
    (sharedCredits.value || 0) > 0 &&
    (sharedCredits.value || 0) < 10,
);

// Chart Logic (from dedicated endpoint)
const riskDistribution = computed(() => {
  if (!riskDistributionData.value) {
    return [
      {
        level: "high",
        label: "Riesgo Alto",
        count: 0,
        color: "bg-risk-high",
        stroke: "#ef4444",
      },
      {
        level: "medium",
        label: "Precaución",
        count: 0,
        color: "bg-risk-medium",
        stroke: "#f59e0b",
      },
      {
        level: "low",
        label: "Seguro",
        count: 0,
        color: "bg-risk-low",
        stroke: "#10b981",
      },
    ];
  }
  const d = riskDistributionData.value;
  return [
    {
      level: "high",
      label: "Riesgo Alto",
      count: d.high,
      color: "bg-risk-high",
      stroke: "#ef4444",
    },
    {
      level: "medium",
      label: "Precaución",
      count: d.medium,
      color: "bg-risk-medium",
      stroke: "#f59e0b",
    },
    {
      level: "low",
      label: "Seguro",
      count: d.low,
      color: "bg-risk-low",
      stroke: "#10b981",
    },
  ];
});

const chartSegments = computed(() => {
  const total = riskDistribution.value.reduce(
    (acc, curr) => acc + curr.count,
    0,
  );
  if (total === 0) return [{ stroke: "#cbd5e1", length: 251.2, offset: 0 }];

  let currentOffset = 0;
  return riskDistribution.value.map((risk) => {
    const length = (risk.count / total) * 251.2;
    const segment = {
      stroke: risk.stroke,
      length,
      offset: currentOffset,
    };
    currentOffset += length;
    return segment;
  });
});

// Auto-switch to basic if they only have 1 credit
watch(
  () => sharedCredits.value,
  (newCredits) => {
    if (newCredits === 1 && analysisType.value === "premium") {
      analysisType.value = "basic";
    }
  },
  { immediate: true },
);

// Fetch user data
const fetchUserData = async () => {
  if (!currentUserId.value) return;

  loading.value = true;

  try {
    // Get headers for SSR (cookies)
    const headers = useRequestHeaders(["cookie"]);

    // Fetch user profile via shared composable (updates state)
    const profile = await fetchUserProfile();
    if (profile) {
      userProfile.value = profile;
    }

    // Fetch sidebar metrics
    try {
      const metricsResponse = await $fetch("/api/dashboard/sidebar-metrics", {
        headers: headers as any,
      });
      sidebarMetrics.value = metricsResponse.metrics;
    } catch (error) {
      console.error("Error fetching sidebar metrics:", error);
      sidebarMetrics.value = null;
    }

    // Fetch risk distribution
    try {
      const distributionResponse = await $fetch(
        "/api/dashboard/risk-distribution",
        {
          headers: headers as any,
        },
      );
      riskDistributionData.value = distributionResponse.distribution;
    } catch (error) {
      console.error("Error fetching risk distribution:", error);
      riskDistributionData.value = null;
    }

    // Fetch limited analyses for recent cards (8 items, minimal fields)
    try {
      const response = await $fetch(
        "/api/analyses?limit=8&projection=id,contract_name,status,risk_level,created_at,user_id",
        { headers: headers as any },
      );
      analyses.value = response.analyses || [];
    } catch (error) {
      console.error("Error fetching analyses:", error);
      analyses.value = [];
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  } finally {
    loading.value = false;
  }
};

const setupRealtimeSubscription = () => {
  if (realtimeChannel || !currentUserId.value) return;

  console.log("Setting up realtime subscription for user:", currentUserId.value);

  realtimeChannel = supabase
    .channel(`analyses-updates-${currentUserId.value}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "analyses",
        filter: `user_id=eq.${currentUserId.value}`,
      },
      async (payload) => {
        const updatedAnalysis = payload.new as Analysis;
        console.log("Realtime update received:", updatedAnalysis);

        // Find and update the analysis in the list
        const index = analyses.value.findIndex(
          (a) => a.id === updatedAnalysis.id,
        );
        if (index !== -1) {
          // Update existing analysis
          analyses.value[index] = {
            ...analyses.value[index],
            ...updatedAnalysis,
          };
        } else {
          // Add to the list if it's not already there
          analyses.value.unshift(updatedAnalysis);
        }

        // If job completed or failed, refresh user profile to ensure credits are correct
        if (
          updatedAnalysis.status === "completed" ||
          updatedAnalysis.status === "failed"
        ) {
          try {
            // Use the Supabase client directly instead of the API endpoint to avoid auth context issues
            const { data: profile, error } = await supabase
              .from("users")
              .select("*")
              .eq("id", currentUserId.value)
              .single();

            if (error) {
              console.error(
                "Error fetching profile in realtime callback:",
                error,
              );
              // Alternative: try to refresh the session first, then fetch
              try {
                await supabase.auth.refreshSession();
                const { data: refreshedProfile, error: refreshError } =
                  await supabase
                    .from("users")
                    .select("*")
                    .eq("id", currentUserId.value)
                    .single();

                if (refreshError) {
                  console.error(
                    "Error fetching profile after refresh:",
                    refreshError,
                  );
                } else if (refreshedProfile) {
                  userProfile.value = refreshedProfile;
                  sharedCredits.value = refreshedProfile.credits;
                  if (userState.value) {
                    userState.value = {
                      ...userState.value,
                      ...refreshedProfile,
                    };
                  }
                }
              } catch (refreshErr) {
                console.error("Error refreshing session:", refreshErr);
              }
            } else if (profile) {
              userProfile.value = profile;
              sharedCredits.value = profile.credits;
              if (userState.value) {
                userState.value = { ...userState.value, ...profile };
              }
            }
          } catch (err) {
            console.error(
              "Error refreshing profile in realtime callback:",
              err,
            );
          }
        }
      },
    )
    .subscribe((status) => {
      console.log("Realtime subscription status:", status);
      if (status === "SUBSCRIBED") {
        console.log("Successfully subscribed to analyses updates");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("Realtime subscription error:", status);
      }
    });
};

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }
});

// Watch for user changes to fetch data and setup realtime
watch(
  currentUserId,
  async (newId) => {
    console.log("currentUserId changed:", newId);
    if (newId) {
      await fetchUserData();
      setupRealtimeSubscription();
      console.log("Realtime subscription setup complete");
    }
  },
  { immediate: true },
);

// Helper functions for status display (extracted to avoid TypeScript type narrowing issues)
const getRiskColor = (riskLevel: string | null) => {
  switch (riskLevel) {
    case "high":
      return "bg-risk-high/10 text-risk-high";
    case "medium":
      return "bg-risk-medium/10 text-risk-medium";
    case "low":
      return "bg-risk-low/10 text-risk-low";
    default:
      return "bg-slate-100 text-slate-400";
  }
};


const lastAnalysisDate = computed(() => {
  if (!sidebarMetrics.value?.lastAnalysisDate) return "Ninguno";

  const lastDate = new Date(sidebarMetrics.value.lastAnalysisDate);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return formatDate(sidebarMetrics.value.lastAnalysisDate);
});

const totalCriticalFindings = computed(() => {
  return sidebarMetrics.value?.totalCriticalFindings || 0;
});

const safetyScore = computed(() => {
  return sidebarMetrics.value?.safetyScore || 0;
});

const monthlyActivity = computed(() => {
  return sidebarMetrics.value?.monthlyActivity || 0;
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const handleDropzoneError = (message: string) => {
  analyzeError.value = message;
};

// Handle uploaded event from Dropzone - file was uploaded successfully
const handleDropzoneUploaded = async (data: { file_url: string }) => {
  if (!data.file_url) return;

  checkingTokens.value = true;
  analyzeError.value = "";

  try {
    uploadedFileUrl.value = data.file_url;

    // Check Tokens
    const tokenResponse = await $fetch<any>("/api/check-tokens", {
      method: "POST",
      body: { file_url: uploadedFileUrl.value },
    });

    if (!tokenResponse.success) {
      throw new Error(tokenResponse.error || "Error calculating tokens");
    }

    tokenCheckResult.value = tokenResponse;
  } catch (error: any) {
    // Extract error message from h3/Nuxt error structure
    const errorMessage =
      error.data?.message ||
      error.message ||
      error.statusMessage ||
      "Error calculating tokens";
    analyzeError.value = errorMessage;
    selectedFile.value = null;
    uploadedFileUrl.value = "";
    tokenCheckResult.value = null;
  } finally {
    checkingTokens.value = false;
  }
};

// Handle complete event - upload reached 100%
const handleDropzoneComplete = () => {
  // Upload completed, tier selector will be shown
};

// Handle cancel event - user cancelled upload
const handleDropzoneCancel = () => {
  selectedFile.value = null;
  uploadedFileUrl.value = "";
  tokenCheckResult.value = null;
  analyzeError.value = "";
};

const handleAnalyze = async () => {
  if (!uploadedFileUrl.value || !contractName.value) return;

  analyzing.value = true;
  analyzeError.value = "";

  try {
    // Use existing uploaded file URL

    // Analyze contract
    const analyzeResponse = await $fetch<{
      success: boolean;
      analysisId: string;
      error?: string;
    }>("/api/analyze", {
      method: "POST",
      body: {
        file_url: uploadedFileUrl.value,
        contract_name: contractName.value,
        analysis_type: analysisType.value,
      },
    });

    if (!analyzeResponse.success || !analyzeResponse.analysisId) {
      throw new Error(analyzeResponse.error || "Error al iniciar análisis");
    }

    // Add as a placeholder to the list and let polling handle the rest
    const newAnalysis: any = {
      id: analyzeResponse.analysisId,
      contract_name: contractName.value,
      status: "pending",
      created_at: new Date().toISOString(),
      risk_level: null,
      summary_json: null,
    };

    analyses.value.unshift(newAnalysis);

    // Clear form
    selectedFile.value = null;
    uploadedFileUrl.value = "";
    contractName.value = "";
    tokenCheckResult.value = null;

    // Refresh profile state
    await fetchUserProfile();
  } catch (error: any) {
    // Extract error message from h3/Nuxt error structure
    const errorMessage =
      error.data?.message || // From createError({ message: ... })
      error.message || // Direct message
      error.statusMessage || // HTTP status message
      "Ocurrió un error durante el análisis";

    analyzeError.value = errorMessage;
  } finally {
    analyzing.value = false;
  }
};

useHead({
  title: "Dashboard",
});
</script>
