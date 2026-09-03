<template>
  <div ref="chart" class="analytics-chart"></div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: { metrics: { type: Array, default: () => [] } },
  data () {
    return { chart: null, chartRequest: 0, destroyed: false, resizeObserver: null }
  },
  mounted () {
    this.startChart(this.metrics)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize())
      this.resizeObserver.observe(this.$el)
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics)
        else this.startChart(metrics)
      }
    }
  },
  beforeDestroy () {
    this.destroyed = true
    this.chartRequest += 1
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.resizeObserver = null
    if (this.chart) this.chart.destroy()
    this.chart = null
  },
  methods: {
    startChart (metrics) {
      const request = ++this.chartRequest
      createChart(this.$refs.chart, metrics, key => this.$emit('select', { key })).then(chart => {
        if (this.destroyed || request !== this.chartRequest) chart.destroy()
        else { this.chart = chart; this.resize() }
      })
    },
    resize () { if (this.chart) this.chart.resize() }
  }
}
</script>
