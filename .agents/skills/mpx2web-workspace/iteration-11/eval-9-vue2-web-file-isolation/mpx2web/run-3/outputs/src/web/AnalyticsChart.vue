<template>
  <div ref="chart" class="analytics-chart"></div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: {
    metrics: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics)
      }
    }
  },
  created () {
    this.chart = null
    this.resizeObserver = null
    this.chartGeneration = 0
    this.disposed = false
  },
  mounted () {
    this.initChart()
  },
  beforeDestroy () {
    this.disposed = true
    this.chartGeneration++
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  methods: {
    async initChart () {
      const generation = ++this.chartGeneration
      const chart = await createChart(this.$refs.chart, this.metrics)
      if (this.disposed || generation !== this.chartGeneration) {
        chart.destroy()
        return
      }
      chart.update(this.metrics)
      this.chart = chart
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.chart) this.chart.resize()
        })
        this.resizeObserver.observe(this.$refs.chart)
      }
    }
  }
}
</script>
