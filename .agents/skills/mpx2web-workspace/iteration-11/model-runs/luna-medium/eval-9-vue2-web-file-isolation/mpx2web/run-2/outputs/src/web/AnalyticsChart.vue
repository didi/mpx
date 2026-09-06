<template>
  <div ref="chart" class="analytics-chart">
    <button v-for="metric in metrics" :id="metric.id || metric.key" :key="metric.key" type="button" class="analytics-chart__metric" @click="selectMetric(metric.key)">
      <span>{{ metric.label }}</span><span>{{ metric.value }}</span>
    </button>
  </div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: { metrics: { type: Array, default: () => [] } },
  data () { return { chartInstance: null, generation: 0, detached: false } },
  mounted () { this.detached = false; this.startChart() },
  beforeDestroy () { this.detached = true; this.generation += 1; this.releaseChart() },
  watch: {
    metrics: { deep: true, handler (metrics) { if (this.chartInstance) this.chartInstance.update(metrics); else if (!this.detached) this.startChart() } }
  },
  methods: {
    isCurrent (generation) { return !this.detached && this.generation === generation },
    releaseChart () { const instance = this.chartInstance; this.chartInstance = null; if (instance && instance.destroy) instance.destroy() },
    async startChart () {
      const generation = ++this.generation
      const instance = await createChart(this.$refs.chart, this.metrics)
      if (!this.isCurrent(generation)) { if (instance && instance.destroy) instance.destroy(); return }
      this.releaseChart()
      this.chartInstance = instance
    },
    resize () { if (this.chartInstance && this.chartInstance.resize) this.chartInstance.resize() },
    selectMetric (key) { this.$emit('select', { detail: { key } }) }
  }
}
</script>
