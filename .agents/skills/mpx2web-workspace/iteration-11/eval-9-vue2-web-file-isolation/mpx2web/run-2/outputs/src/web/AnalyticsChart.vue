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
  beforeDestroy () {
    this.chartGeneration++
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.chart) this.chart.destroy()
    this.resizeObserver = null
    this.chart = null
  },
  methods: {
    async initChart () {
      const generation = ++this.chartGeneration
      const chart = await createChart(this.$refs.chart, this.metrics)
      if (generation !== this.chartGeneration) {
        chart.destroy()
        return
      }
      this.chart = chart
      chart.update(this.metrics)
      this.resizeObserver = new ResizeObserver(() => chart.resize())
      this.resizeObserver.observe(this.$refs.chart)
    }
  }
}
</script>
