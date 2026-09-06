<template>
  <section ref="root" class="analytics-chart">
    <div ref="surface" class="analytics-chart__surface" aria-live="polite"></div>
    <button
      v-for="metric in metrics"
      :id="metric.key"
      :key="metric.key"
      type="button"
      class="analytics-chart__metric"
      @click="selectMetric(metric.key)"
    >
      <span>{{ metric.label }}</span>
      <strong>{{ metric.value }}</strong>
    </button>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createChart } from './chart-sdk'

const props = defineProps({
  metrics: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['select'])
const root = ref(null)
const surface = ref(null)
let chart = null
let observer = null
let disposed = false
let generation = 0

function isCurrent (token) {
  return !disposed && token === generation
}

function destroyChart () {
  const instance = chart
  chart = null
  if (instance && instance.destroy) instance.destroy()
}

async function ensureChart () {
  const token = ++generation
  await nextTick()
  if (!isCurrent(token) || !surface.value) return

  const instance = await createChart(surface.value, props.metrics)
  if (!isCurrent(token)) {
    if (instance && instance.destroy) instance.destroy()
    return
  }

  destroyChart()
  chart = instance
  bindResizeObserver(token, instance)
}

function bindResizeObserver (token, instance) {
  if (observer) observer.disconnect()
  if (typeof ResizeObserver === 'undefined' || !root.value) return
  const currentObserver = new ResizeObserver(() => {
    if (!isCurrent(token) || chart !== instance || observer !== currentObserver) return
    if (instance && instance.resize) instance.resize()
  })
  observer = currentObserver
  currentObserver.observe(root.value)
}

function selectMetric (key) {
  emit('select', { key })
}

watch(() => props.metrics, (metrics) => {
  if (chart) {
    chart.update(metrics)
  } else if (!disposed) {
    ensureChart()
  }
}, { deep: true })

onMounted(() => {
  ensureChart()
})

onBeforeUnmount(() => {
  disposed = true
  generation += 1
  if (observer) observer.disconnect()
  observer = null
  destroyChart()
})
</script>

<style scoped>
.analytics-chart { min-width: max-content; }
.analytics-chart__surface { min-height: 24px; }
.analytics-chart__metric { display: block; width: 100%; text-align: left; }
</style>
