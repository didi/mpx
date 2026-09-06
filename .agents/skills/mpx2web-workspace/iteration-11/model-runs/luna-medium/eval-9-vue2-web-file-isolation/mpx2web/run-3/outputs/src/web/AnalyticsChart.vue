<template>
  <div ref="chart" class="analytics-chart"></div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: { metrics: { type: Array, default: () => [] } },
  data () { return { chart: null, chartGeneration: 0 } },
  mounted () { this.initChart(this.metrics) },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart && this.chart.update) this.chart.update(metrics || [])
        else this.initChart(metrics || [])
      }
    }
  },
  methods: {
    async initChart (metrics) {
      const generation = ++this.chartGeneration
      const instance = await createChart(this.$refs.chart, metrics || [], (key) => this.$emit('select', { key }))
      if (this._isDestroyed || generation !== this.chartGeneration) {
        if (instance && instance.destroy) instance.destroy()
        return
      }
      this.releaseChart()
      this.chart = instance
    },
    releaseChart () {
      const chart = this.chart
      this.chart = null
      if (chart && chart.destroy) chart.destroy()
    },
    resize () { if (this.chart && this.chart.resize) this.chart.resize() }
  },
  beforeDestroy () {
    this.chartGeneration += 1
    this.releaseChart()
  }
}
</script>

<style>
.analytics-chart { min-width: 100%; min-height: 120px; }
</style>
