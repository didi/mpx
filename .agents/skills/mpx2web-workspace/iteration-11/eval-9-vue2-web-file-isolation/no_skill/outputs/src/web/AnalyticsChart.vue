<template>
  <div ref="chart" class="analytics-chart" role="list" aria-label="数据指标图表"></div>
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
      requestId: 0,
      resizeObserver: null,
      resizeFrame: null,
      removeWindowResize: null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler () {
        this.renderChart()
      }
    }
  },
  mounted () {
    this.observeSize()
    this.renderChart()
  },
  beforeDestroy () {
    this.requestId += 1
    this.disconnectSizeObserver()
    this.destroyChart()
  },
  methods: {
    renderChart () {
      const requestId = ++this.requestId
      const element = this.$refs.chart
      const metrics = Array.isArray(this.metrics) ? this.metrics.slice() : []

      this.destroyChart()
      createChart(element, metrics, {
        onSelect: this.handleSelect,
        isCurrent: () => this.requestId === requestId && !this._isBeingDestroyed
      }).then((chart) => {
        if (!chart) return
        if (this.requestId !== requestId || this._isBeingDestroyed) {
          chart.destroy()
          return
        }
        this.chart = chart
        this.resizeChart()
      })
    },
    handleSelect (metric) {
      this.$emit('select', { key: metric.key })
    },
    destroyChart () {
      if (!this.chart) return
      this.chart.destroy()
      this.chart = null
    },
    observeSize () {
      const onResize = () => {
        if (this.resizeFrame !== null) return
        this.resizeFrame = requestAnimationFrame(() => {
          this.resizeFrame = null
          this.resizeChart()
        })
      }
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(onResize)
        this.resizeObserver.observe(this.$el)
      } else {
        window.addEventListener('resize', onResize)
        this.removeWindowResize = () => window.removeEventListener('resize', onResize)
      }
    },
    disconnectSizeObserver () {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      if (this.removeWindowResize) {
        this.removeWindowResize()
        this.removeWindowResize = null
      }
      if (this.resizeFrame !== null) {
        cancelAnimationFrame(this.resizeFrame)
        this.resizeFrame = null
      }
    },
    resizeChart () {
      if (this.chart) this.chart.resize()
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  min-width: 100%;
}
</style>
