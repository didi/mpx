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
      chartGeneration: 0,
      disposed: false
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics || [])
      }
    }
  },
  mounted () {
    this.disposed = false
    this.observeSize()
    this.initializeChart()
  },
  beforeDestroy () {
    this.disposed = true
    this.chartGeneration += 1

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
    async initializeChart () {
      const element = this.$refs.chart
      const generation = ++this.chartGeneration
      let chart

      try {
        chart = await createChart(element, this.metrics || [], this.handleMetricSelect)
      } catch (error) {
        if (!this.disposed && generation === this.chartGeneration) {
          this.$emit('error', error)
        }
        return
      }

      if (this.disposed || generation !== this.chartGeneration || element !== this.$refs.chart) {
        if (chart && chart.destroy) chart.destroy()
        return
      }

      if (this.chart) this.chart.destroy()
      this.chart = chart
      this.chart.update(this.metrics || [])
      this.chart.resize()
    },
    observeSize () {
      if (typeof ResizeObserver === 'undefined') return

      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) this.chart.resize()
      })
      this.resizeObserver.observe(this.$refs.chart)
    },
    handleMetricSelect (key) {
      this.$emit('select', {
        type: 'select',
        detail: { key }
      })
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  display: inline-flex;
  flex-wrap: nowrap;
  min-width: 100%;
  box-sizing: border-box;
}
</style>
