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
      chartInstance: null,
      chartRequestId: 0,
      latestMetrics: [],
      resizeObserver: null,
      resizeFrame: null,
      windowResizeHandler: null,
      componentDestroyed: false
    }
  },
  watch: {
    metrics: {
      deep: true,
      immediate: true,
      handler (metrics) {
        this.latestMetrics = Array.isArray(metrics) ? metrics.slice() : []
        if (this.chartInstance) {
          this.chartInstance.update(this.latestMetrics)
          this.queueResize()
        }
      }
    }
  },
  mounted () {
    this.initializeChart()
  },
  beforeDestroy () {
    this.componentDestroyed = true
    this.chartRequestId += 1
    this.stopObservingSize()

    if (this.chartInstance) {
      this.chartInstance.destroy()
      this.chartInstance = null
    }
  },
  methods: {
    async initializeChart () {
      const element = this.$refs.chart
      const requestId = ++this.chartRequestId

      try {
        const instance = await createChart(element, this.latestMetrics, {
          onSelect: (detail) => {
            if (!this.componentDestroyed && requestId === this.chartRequestId) {
              this.$emit('select', detail)
            }
          }
        })

        if (
          this.componentDestroyed ||
          requestId !== this.chartRequestId ||
          element !== this.$refs.chart
        ) {
          instance.destroy()
          return
        }

        this.chartInstance = instance
        this.chartInstance.update(this.latestMetrics)
        this.startObservingSize()
        this.queueResize()
      } catch (error) {
        if (!this.componentDestroyed && requestId === this.chartRequestId) {
          this.$emit('chart-error', { error })
        }
      }
    },
    startObservingSize () {
      const element = this.$refs.chart
      if (!element || this.resizeObserver || this.windowResizeHandler) return

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.queueResize())
        this.resizeObserver.observe(element)
        return
      }

      if (typeof window !== 'undefined') {
        this.windowResizeHandler = () => this.queueResize()
        window.addEventListener('resize', this.windowResizeHandler)
      }
    },
    stopObservingSize () {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }

      if (this.windowResizeHandler && typeof window !== 'undefined') {
        window.removeEventListener('resize', this.windowResizeHandler)
        this.windowResizeHandler = null
      }

      if (this.resizeFrame !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.resizeFrame)
      }
      this.resizeFrame = null
    },
    queueResize () {
      if (!this.chartInstance || this.componentDestroyed) return

      if (typeof requestAnimationFrame !== 'function') {
        this.chartInstance.resize()
        return
      }

      if (this.resizeFrame !== null) return
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = null
        if (this.chartInstance && !this.componentDestroyed) {
          this.chartInstance.resize()
        }
      })
    }
  }
}
</script>

<style>
.analytics-chart {
  box-sizing: border-box;
  min-width: 100%;
  min-height: 100%;
}

.analytics-chart-sdk {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(144px, 1fr);
  gap: 12px;
  box-sizing: border-box;
  min-width: 100%;
  padding: 12px;
}

.analytics-chart-sdk__metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 88px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  cursor: pointer;
}

.analytics-chart-sdk__metric:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.analytics-chart-sdk__label {
  color: #6b7280;
  font-size: 13px;
}

.analytics-chart-sdk__value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
}

.analytics-chart-sdk--compact {
  grid-auto-columns: minmax(124px, 1fr);
}
</style>
