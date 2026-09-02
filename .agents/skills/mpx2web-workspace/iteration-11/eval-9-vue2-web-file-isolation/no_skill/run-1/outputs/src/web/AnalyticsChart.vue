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
      chart: null,
      chartPromise: null,
      chartGeneration: 0,
      resizeObserver: null,
      windowResizeHandler: null,
      isDestroyed: false
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) {
          this.chart.update(metrics)
          return
        }
        this.startChart()
      }
    }
  },
  mounted () {
    this.isDestroyed = false
    this.startResizeTracking()
    this.startChart()
  },
  beforeDestroy () {
    this.isDestroyed = true
    this.chartGeneration += 1
    this.stopResizeTracking()
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
    this.chartPromise = null
  },
  methods: {
    async startChart () {
      const element = this.$refs.chart
      if (!element || this.chart || this.chartPromise || this.isDestroyed) return

      const generation = this.chartGeneration
      const promise = Promise.resolve(createChart(element, this.metrics, {
        onSelect: this.handleSelect
      }))
      this.chartPromise = promise

      try {
        const chart = await promise
        const isStale = this.isDestroyed ||
          generation !== this.chartGeneration ||
          element !== this.$refs.chart

        if (isStale) {
          if (chart && typeof chart.destroy === 'function') chart.destroy()
          return
        }

        this.chart = chart
        this.chart.update(this.metrics)
        this.chart.resize()
      } catch (error) {
        if (!this.isDestroyed && generation === this.chartGeneration) {
          this.$emit('chart-error', { detail: { error } })
        }
      } finally {
        if (this.chartPromise === promise) this.chartPromise = null
      }
    },
    handleSelect (detail) {
      if (!this.isDestroyed) this.$emit('select', { detail })
    },
    handleResize () {
      if (!this.isDestroyed && this.chart) this.chart.resize()
    },
    startResizeTracking () {
      const element = this.$refs.chart
      if (!element) return

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.handleResize)
        this.resizeObserver.observe(element)
        return
      }

      if (typeof window !== 'undefined') {
        this.windowResizeHandler = this.handleResize
        window.addEventListener('resize', this.windowResizeHandler)
      }
    },
    stopResizeTracking () {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      if (this.windowResizeHandler && typeof window !== 'undefined') {
        window.removeEventListener('resize', this.windowResizeHandler)
        this.windowResizeHandler = null
      }
    }
  }
}
</script>

<style>
.analytics-chart {
  box-sizing: border-box;
  display: flex;
  min-width: max-content;
  min-height: 100%;
  gap: 16px;
  padding: 16px;
}

.analytics-chart__metric {
  box-sizing: border-box;
  width: 220px;
  min-height: 132px;
  padding: 16px;
  border: 1px solid #e4e7ec;
  border-radius: 12px;
  background: #fff;
  color: #101828;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.analytics-chart__metric:hover,
.analytics-chart__metric:focus-visible {
  border-color: #7f56d9;
  box-shadow: 0 6px 18px rgba(127, 86, 217, 0.16);
  outline: none;
  transform: translateY(-2px);
}

.analytics-chart__label,
.analytics-chart__value {
  display: block;
}

.analytics-chart__label {
  color: #667085;
  font-size: 13px;
}

.analytics-chart__value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.analytics-chart__track {
  display: block;
  height: 8px;
  margin-top: 20px;
  overflow: hidden;
  border-radius: 999px;
  background: #f2f4f7;
}

.analytics-chart__bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #7f56d9;
  transition: width 0.25s ease;
}

.analytics-chart.is-compact {
  gap: 10px;
  padding: 10px;
}

.analytics-chart.is-compact .analytics-chart__metric {
  width: 180px;
}
</style>
