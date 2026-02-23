<template>
  <span
    class="inline-flex items-center gap-2 rounded-full font-black uppercase tracking-wider"
    :class="[sizeClasses, statusBgClass, statusTextClass]"
  >
    <!-- Status dot -->
    <span
      class="rounded-full"
      :class="[dotSizeClass, statusColorClass, pulseClass]"
    ></span>
    <!-- Status label -->
    <span class="whitespace-nowrap">{{ statusLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import {
  getStatusLabel,
  getStatusColor,
  getStatusBgClass,
  getStatusTextClass,
  isActiveStatus,
} from '~/composables/useAnalysisStatus'

type SizeVariant = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    status: string
    size?: SizeVariant
    showPulse?: boolean
  }>(),
  {
    size: 'md',
    showPulse: true,
  },
)

// Compute status values
const statusLabel = computed(() => getStatusLabel(props.status))
const statusColorClass = computed(() => getStatusColor(props.status))
const statusBgClass = computed(() => getStatusBgClass(props.status))
const statusTextClass = computed(() => getStatusTextClass(props.status))

// Size variants
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2 py-0.5 text-[9px]'
    case 'md':
      return 'px-3 py-1.5 text-[10px]'
    case 'lg':
      return 'px-4 py-2 text-xs'
    default:
      return 'px-3 py-1.5 text-[10px]'
  }
})

const dotSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-1.5 h-1.5'
    case 'md':
      return 'w-2 h-2'
    case 'lg':
      return 'w-2.5 h-2.5'
    default:
      return 'w-2 h-2'
  }
})

// Pulse animation for active states
const pulseClass = computed(() => {
  if (!props.showPulse) return ''
  return isActiveStatus(props.status) ? 'animate-pulse' : ''
})
</script>

<style scoped>
/* Ensure pulse animation is smooth */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
