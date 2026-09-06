<template>
  <div ref="chart" class="analytics-chart" role="list" />
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: {
    metrics: { type: Array, default: () => [] }
  },
  data () {
    return {
      chart: null,
      requestId: 0,
      resizeObserver: null,
      destroyed: false
    }
  },
  mounted () {
    this.destroyed = false
    this.mountChart()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart && typeof this.chart.resize === 'function') this.chart.resize()
      })
      this.resizeObserver.observe(this.$refs.chart)
    }
  },
  beforeDestroy () {
    this.destroyed = true
    this.requestId += 1
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics || [])
        else this.mountChart()
      }
    }
  },
  methods: {
    async mountChart () {
      const requestId = ++this.requestId
      const element = this.$refs.chart
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
      const pendingChart = await createChart(
        element,
        this.metrics || [],
        metric => this.$emit('select', { key: metric && metric.key })
      )
      if (this.destroyed || requestId !== this.requestId || element !== this.$refs.chart) {
        pendingChart.destroy()
        return
      }
      this.chart = pendingChart
    }
  }
}
</script>
