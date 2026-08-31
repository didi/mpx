<template>
  <div ref="chartElement" class="analytics-chart" @click="selectMetric"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createChart } from './chart-sdk'

const props = defineProps({
  metrics: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['select'])
const chartElement = ref(null)

let chart
let resizeObserver
let mountId = 0

onMounted(async () => {
  const currentMountId = ++mountId
  const element = chartElement.value
  const instance = await createChart(element, props.metrics)

  if (currentMountId !== mountId) {
    instance.destroy()
    return
  }

  chart = instance
  chart.update(props.metrics)
  resizeObserver = new ResizeObserver(() => instance.resize())
  resizeObserver.observe(element)
})

watch(
  () => props.metrics,
  (metrics) => {
    if (chart) chart.update(metrics)
  },
  { deep: true }
)

onBeforeUnmount(() => {
  mountId++
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chart) {
    chart.destroy()
    chart = null
  }
})

function selectMetric (event) {
  const metric = event.target.closest('[data-metric-key]')
  if (metric && chartElement.value.contains(metric)) {
    emit('select', { key: metric.dataset.metricKey })
  }
}
</script>
