<template>
  <div ref="chart" class="analytics-chart"></div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: { metrics: { type: Array, default: () => [] } },
  data () {
    return { chart: null, chartGeneration: 0, destroyed: false, resizeObserver: null }
  },
  mounted () {
    this.createChart()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize())
      this.resizeObserver.observe(this.$refs.chart)
    }
  },
  beforeDestroy () {
    this.destroyed = true
    this.chartGeneration += 1
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.destroyChart()
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics)
        else this.createChart()
      }
    }
  },
  methods: {
    async createChart () {
      const generation = ++this.chartGeneration
      const instance = await createChart(this.$refs.chart, this.metrics, (detail) => {
        this.$emit('select', detail)
      })
      if (this.destroyed || generation !== this.chartGeneration) {
        if (instance && instance.destroy) instance.destroy()
        return
      }
      this.chart = instance
    },
    destroyChart () {
      if (this.chart && this.chart.destroy) this.chart.destroy()
      this.chart = null
    },
    resize () {
      if (this.chart && this.chart.resize) this.chart.resize()
    }
  }
}
</script>
