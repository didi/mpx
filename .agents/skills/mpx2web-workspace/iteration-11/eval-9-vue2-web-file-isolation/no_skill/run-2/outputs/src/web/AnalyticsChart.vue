<template>
  <div ref="chart" class="analytics-chart" />
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
      active: false,
      destroyed: false,
      chart: null,
      chartInitId: 0,
      chartController: null,
      resizeObserver: null,
      windowResizeHandler: null
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
    this.start()
  },
  activated () {
    this.start()
  },
  deactivated () {
    this.stop()
  },
  beforeDestroy () {
    this.destroyed = true
    this.stop()
  },
  methods: {
    start () {
      if (this.active || this.destroyed) return
      this.active = true
      this.observeSize()
      this.initChart()
    },
    async initChart () {
      const chartInitId = ++this.chartInitId
      this.chartController = typeof AbortController === 'undefined' ? null : new AbortController()
      const chart = await createChart(this.$refs.chart, this.metrics, {
        signal: this.chartController && this.chartController.signal,
        onSelect: (detail) => this.$emit('select', detail)
      })

      if (!chart) return
      if (!this.active || this.destroyed || chartInitId !== this.chartInitId) {
        chart.destroy()
        return
      }

      this.chart = chart
      this.chart.update(this.metrics)
      this.chart.resize()
    },
    observeSize () {
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.chart) this.chart.resize()
        })
        this.resizeObserver.observe(this.$refs.chart)
        return
      }

      this.windowResizeHandler = () => {
        if (this.chart) this.chart.resize()
      }
      window.addEventListener('resize', this.windowResizeHandler)
    },
    stop () {
      if (!this.active) return
      this.active = false
      this.chartInitId++

      if (this.chartController) {
        this.chartController.abort()
        this.chartController = null
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      if (this.windowResizeHandler) {
        window.removeEventListener('resize', this.windowResizeHandler)
        this.windowResizeHandler = null
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
</style>
