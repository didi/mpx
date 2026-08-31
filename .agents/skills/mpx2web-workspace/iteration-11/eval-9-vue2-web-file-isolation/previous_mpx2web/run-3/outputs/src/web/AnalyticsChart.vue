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
  data () {
    return {
      chart: null,
      resizeObserver: null,
      initVersion: 0,
      destroyed: false
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
  beforeDestroy () {
    this.destroyed = true
    this.initVersion++
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
      const initVersion = ++this.initVersion
      const chart = await createChart(this.$refs.chart, this.metrics, {
        onSelect: (key) => this.$emit('select', { key })
      })
      if (this.destroyed || initVersion !== this.initVersion) {
        chart.destroy()
        return
      }
      this.chart = chart
      this.chart.update(this.metrics)
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
