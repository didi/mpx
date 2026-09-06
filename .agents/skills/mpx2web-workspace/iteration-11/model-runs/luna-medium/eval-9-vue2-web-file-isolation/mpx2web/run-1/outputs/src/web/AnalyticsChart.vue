<template>
  <div ref="chart" class="analytics-chart"></div>
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
      chartGeneration: 0,
      detached: false,
      resizeObserver: null
    }
  },
  mounted () {
    this.initChart()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        if (!this.detached && this.resizeObserver === observer) this.resize()
      })
      this.resizeObserver = observer
      this.resizeObserver.observe(this.$refs.chart)
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics)
        else this.initChart()
      }
    }
  },
  methods: {
    isCurrent (generation) {
      return !this.detached && this.chartGeneration === generation && this.$refs.chart
    },
    releaseChart () {
      const chart = this.chart
      this.chart = null
      if (chart && chart.destroy) chart.destroy()
    },
    async initChart () {
      const generation = ++this.chartGeneration
      const element = this.$refs.chart
      if (!element || this.detached) return
      const chart = await createChart(element)
      if (!this.isCurrent(generation)) {
        if (chart && chart.destroy) chart.destroy()
        return
      }
      this.releaseChart()
      this.chart = chart
      chart.update(this.metrics)
    },
    resize () {
      if (this.chart && this.chart.resize) this.chart.resize()
    }
  },
  beforeDestroy () {
    this.detached = true
    ++this.chartGeneration
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.resizeObserver = null
    this.releaseChart()
  }
}
</script>
