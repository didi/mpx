<template>
  <div ref="chartElement" class="analytics-chart"></div>
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
const chartElement = ref(null)

let chart = null
let resizeObserver = null
let createGeneration = 0
let creating = false
let disposed = false

async function ensureChart () {
  if (disposed || creating || !chartElement.value) return

  creating = true
  const generation = ++createGeneration
  const element = chartElement.value
  let nextChart

  try {
    nextChart = await createChart(element, props.metrics, {
      onSelect (detail) {
        if (!disposed && generation === createGeneration) emit('select', detail)
      }
    })
  } catch (error) {
    if (!disposed && generation === createGeneration) {
      console.error('Failed to create analytics chart.', error)
    }
    return
  } finally {
    if (generation === createGeneration) creating = false
  }

  if (disposed || generation !== createGeneration || element !== chartElement.value) {
    nextChart.destroy()
    return
  }

  chart = nextChart
  chart.update(props.metrics)
  chart.resize()
}

watch(
  () => props.metrics,
  (metrics) => {
    if (chart) {
      chart.update(metrics)
      return
    }
    nextTick(ensureChart)
  },
  { deep: true }
)

onMounted(() => {
  disposed = false
  if (typeof ResizeObserver !== 'undefined' && chartElement.value) {
    resizeObserver = new ResizeObserver(() => {
      if (chart) chart.resize()
    })
    resizeObserver.observe(chartElement.value)
  }
  ensureChart()
})

onBeforeUnmount(() => {
  disposed = true
  createGeneration += 1
  creating = false

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chart) {
    chart.destroy()
    chart = null
  }
})
</script>

<style>
.analytics-chart {
  display: flex;
  align-items: stretch;
  min-width: 100%;
  min-height: 100%;
  gap: 12px;
}

.analytics-chart__metric {
  display: inline-flex;
  flex: 0 0 auto;
  flex-direction: column;
  justify-content: center;
  min-width: 120px;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fff;
  color: inherit;
  cursor: pointer;
}

.analytics-chart__label {
  font-size: 12px;
  color: #666;
}

.analytics-chart__value {
  margin-top: 6px;
  font-size: 20px;
}
</style>
