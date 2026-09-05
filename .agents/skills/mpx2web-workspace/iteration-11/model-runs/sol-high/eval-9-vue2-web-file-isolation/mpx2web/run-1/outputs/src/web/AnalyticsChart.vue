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
      resizeObserver: null,
      disposed: false
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
    this.disposed = false
    this.createChartInstance()
  },
  beforeDestroy () {
    this.disposed = true
    this.chartGeneration += 1
    this.disconnectResizeObserver()
    if (this.chart) this.chart.destroy()
    this.chart = null
  },
  methods: {
    async createChartInstance () {
      const generation = ++this.chartGeneration
      const element = this.$refs.chart
      let chart

      try {
        chart = await createChart(element, this.metrics, {
          onSelect: (detail) => this.$emit('select', detail)
        })
      } catch (error) {
        if (!this.disposed && generation === this.chartGeneration) {
          this.$emit('chart-error', error)
        }
        return
      }

      if (this.disposed || generation !== this.chartGeneration || this.$refs.chart !== element) {
        chart.destroy()
        return
      }

      if (this.chart) this.chart.destroy()
      this.chart = chart
      this.chart.update(this.metrics)
      this.observeChartSize(element, chart)
    },
    observeChartSize (element, chart) {
      this.disconnectResizeObserver()
      if (typeof ResizeObserver === 'undefined') return

      this.resizeObserver = new ResizeObserver(() => {
        if (!this.disposed && this.chart === chart) chart.resize()
      })
      this.resizeObserver.observe(element)
    },
    disconnectResizeObserver () {
      if (this.resizeObserver) this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  }
}
</script>
