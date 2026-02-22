<template>
  <div
    :class="[
      'inline-block animate-spin rounded-full border-secondary',
      sizeClasses[size],
      thicknessClasses[size],
      color === 'white' ? '!border-t-white !border-white/30' : 'border-b-transparent'
    ]"
    role="status"
  >
    <span class="sr-only">Cargando...</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'secondary' | 'white'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'secondary'
})

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

const thicknessClasses = {
  xs: 'border',
  sm: 'border-2',
  md: 'border-2',
  lg: 'border-[3px]',
  xl: 'border-4'
}
</script>
