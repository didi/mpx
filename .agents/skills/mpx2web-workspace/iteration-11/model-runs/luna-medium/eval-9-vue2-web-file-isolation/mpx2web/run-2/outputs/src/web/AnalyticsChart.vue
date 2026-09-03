<template>
  <div ref="chart" class="analytics-chart"></div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: { metrics: { type: Array, default: () => [] } },
  data () { return { chart: null, initId: 0, resizeObserver: null, destroyed: false } },
  mounted () {
    this.destroyed = false
    this.initChart()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => { if (this.chart) this.chart.resize() })
      this.resizeObserver.observe(this.$refs.chart)
    }
  },
  watch: {
    metrics: { deep: true, handler (nextMetrics) { if (this.chart) this.chart.update(nextMetrics) } }
  },
  methods: {
    async initChart () {
      const id = ++this.initId
      const instance = await createChart(this.$refs.chart, this.metrics)
      if (id !== this.initId || this.destroyed) {
        if (instance && instance.destroy) instance.destroy()
        return
      }
      instance.update(this.metrics)
      this.chart = instance
    }
  },
  beforeDestroy () {
    this.destroyed = true
    ++this.initId
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.chart && this.chart.destroy) this.chart.destroy()
    this.resizeObserver = null
    this.chart = null
  }
}
</script>

<style scoped>
.analytics-chart { min-width: 100%; min-height: 1px; }
</style>
