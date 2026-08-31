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
  data () {
    return {
      chart: null,
      chartGeneration: 0,
      resizeObserver: null
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
  mounted () {
    this.initChart()
  },
  // Vue 2.7 cleanup hook.
  // eslint-disable-next-line vue/no-deprecated-destroyed-lifecycle
  beforeDestroy () {
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

      if (generation !== this.chartGeneration || this._isBeingDestroyed || this._isDestroyed) {
        chart.destroy()
        return
      }

      this.chart = chart
      chart.update(this.metrics)
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart === chart) chart.resize()
      })
      this.resizeObserver.observe(this.$refs.chart)
    }
  }
}
</script>

<template>
  <div ref="chart" class="analytics-chart" />
</template>
