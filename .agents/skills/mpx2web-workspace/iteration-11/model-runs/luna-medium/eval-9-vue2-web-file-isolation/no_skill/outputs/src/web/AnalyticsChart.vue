<template>
  <div class="analytics-chart">
    <button v-for="metric in metrics" :id="metric.key" :key="metric.key" type="button"
      class="analytics-chart__metric" @click="selectMetric(metric.key)">
      <span>{{ metric.label }}</span><strong>{{ metric.value }}</strong>
    </button>
    <div ref="chart" class="analytics-chart__canvas"></div>
  </div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: { metrics: { type: Array, default: () => [] } },
  data () { return { chart: null, chartRequest: 0, destroyed: false, resizeObserver: null } },
  mounted () {
    this.startChart()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart && this.chart.resize) this.chart.resize()
      })
      this.resizeObserver.observe(this.$el)
    }
  },
  beforeDestroy () {
    this.destroyed = true
    this.chartRequest += 1
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.resizeObserver = null
    if (this.chart && this.chart.destroy) this.chart.destroy()
    this.chart = null
  },
  watch: {
    metrics: { deep: true, handler () { this.chart ? this.chart.update(this.metrics) : this.startChart() } }
  },
  methods: {
    startChart () {
      const request = ++this.chartRequest
      const element = this.$refs.chart
      const isCurrent = () => !this.destroyed && request === this.chartRequest
      createChart(element, this.metrics, { isCurrent }).then(chart => {
        if (!chart) return
        if (!isCurrent()) { chart.destroy(); return }
        if (this.chart && this.chart !== chart) this.chart.destroy()
        this.chart = chart
        chart.update(this.metrics)
      })
    },
    selectMetric (key) { this.$emit('select', { detail: { key } }) }
  }
}
</script>
