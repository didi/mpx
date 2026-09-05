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
      createVersion: 0,
      disposed: false,
      resizeObserver: null,
      windowResizeHandler: null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) {
          this.chart.update(metrics)
        }
      }
    }
  },
  mounted () {
    this.disposed = false
    this.observeSize()
    this.mountChart()
  },
  beforeDestroy () {
    this.dispose()
  },
  methods: {
    async mountChart () {
      const element = this.$refs.chart
      const version = ++this.createVersion
      let chart = null

      try {
        chart = await createChart(element, this.metrics, {
          onSelect: this.handleSelect,
          isCancelled: () => (
            this.disposed ||
            version !== this.createVersion ||
            element !== this.$refs.chart
          )
        })
      } catch (error) {
        if (!this.disposed && version === this.createVersion) {
          this.$emit('error', error)
        }
        return
      }

      if (!chart) return

      if (this.disposed || version !== this.createVersion || element !== this.$refs.chart) {
        chart.destroy()
        return
      }

      if (this.chart) {
        this.chart.destroy()
      }
      this.chart = chart
      this.chart.update(this.metrics)
      this.chart.resize()
    },
    handleSelect (metric) {
      if (this.disposed || !metric) return
      this.$emit('select', {
        key: metric.key,
        metric
      })
    },
    observeSize () {
      const element = this.$refs.chart
      if (!element) return

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.chart && !this.disposed) {
            this.chart.resize()
          }
        })
        this.resizeObserver.observe(element)
        return
      }

      if (typeof window !== 'undefined') {
        this.windowResizeHandler = () => {
          if (this.chart && !this.disposed) {
            this.chart.resize()
          }
        }
        window.addEventListener('resize', this.windowResizeHandler)
      }
    },
    dispose () {
      if (this.disposed) return
      this.disposed = true
      this.createVersion += 1

      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      if (this.windowResizeHandler && typeof window !== 'undefined') {
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

<style>
.analytics-chart {
  display: flex;
  align-items: stretch;
  min-width: min-content;
  min-height: 180px;
  gap: 12px;
  padding: 16px;
  box-sizing: border-box;
}

.analytics-chart__metric {
  position: relative;
  display: flex;
  flex: 0 0 160px;
  min-height: 148px;
  padding: 16px;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #e4e7ec;
  border-radius: 12px;
  background: #fff;
  color: #101828;
  cursor: pointer;
  text-align: left;
}

.analytics-chart__metric:focus-visible {
  outline: 2px solid #5b7cfa;
  outline-offset: 2px;
}

.analytics-chart__label,
.analytics-chart__value {
  position: relative;
  z-index: 1;
}

.analytics-chart__label {
  color: #667085;
  font-size: 13px;
}

.analytics-chart__value {
  font-size: 24px;
  font-weight: 600;
}

.analytics-chart__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 5px;
  max-width: 100%;
  background: #5b7cfa;
}
</style>
