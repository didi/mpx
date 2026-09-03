<template>
  <div ref="chart" class="analytics-chart" aria-label="数据指标图表"></div>
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
      disposed: false,
      initGeneration: 0
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
    this.initializeChart()
  },
  beforeDestroy () {
    this.disposeChart()
  },
  methods: {
    async initializeChart () {
      const generation = ++this.initGeneration
      const chart = await createChart(this.$refs.chart, this.metrics || [], (key) => {
        if (!this.disposed && generation === this.initGeneration) this.$emit('select', { key })
      })

      if (this.disposed || generation !== this.initGeneration) {
        chart.destroy()
        return
      }

      this.chart = chart
      this.chart.update(this.metrics || [])
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.chart) this.chart.resize()
        })
        this.resizeObserver.observe(this.$refs.chart)
      }
    },
    disposeChart () {
      this.disposed = true
      this.initGeneration += 1
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  min-height: 180px;
}
</style>
