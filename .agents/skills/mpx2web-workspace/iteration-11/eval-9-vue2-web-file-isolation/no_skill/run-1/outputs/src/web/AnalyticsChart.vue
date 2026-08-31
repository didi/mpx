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
      chartVersion: 0,
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
    this.initChart()
  },
  beforeDestroy () {
    this.disposed = true
    this.chartVersion++
    if (this.chartAbortController) this.chartAbortController.abort()
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.windowResizeHandler) window.removeEventListener('resize', this.windowResizeHandler)
    if (this.chart) this.chart.destroy()
    this.chart = null
    this.chartAbortController = null
    this.resizeObserver = null
    this.windowResizeHandler = null
  },
  methods: {
    async initChart () {
      const version = ++this.chartVersion
      const element = this.$refs.chart
      const controller = typeof AbortController === 'function' ? new AbortController() : null
      this.chartAbortController = controller

      try {
        const chart = await createChart(element, this.metrics, {
          signal: controller && controller.signal,
          onSelect: (key) => this.$emit('select', { key })
        })

        if (this.disposed || version !== this.chartVersion || element !== this.$refs.chart) {
          chart.destroy()
          return
        }

        this.chart = chart
        this.chart.update(this.metrics)
        this.observeSize(element)
      } catch (error) {
        if (!this.disposed && version === this.chartVersion) this.$emit('error', error)
      }
    },
    observeSize (element) {
      if (typeof ResizeObserver === 'function') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.chart && !this.disposed) this.chart.resize()
        })
        this.resizeObserver.observe(element)
        return
      }

      this.windowResizeHandler = () => {
        if (this.chart && !this.disposed) this.chart.resize()
      }
      window.addEventListener('resize', this.windowResizeHandler)
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  width: 100%;
  min-width: 0;
}

.analytics-chart :deep(.analytics-chart__items) {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  min-height: 180px;
}

.analytics-chart :deep(.analytics-chart__metric) {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 72px;
  height: 160px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.analytics-chart :deep(.analytics-chart__bar) {
  display: block;
  width: 100%;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: #2f7cf6;
}

.analytics-chart :deep(.analytics-chart__label),
.analytics-chart :deep(.analytics-chart__value) {
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
