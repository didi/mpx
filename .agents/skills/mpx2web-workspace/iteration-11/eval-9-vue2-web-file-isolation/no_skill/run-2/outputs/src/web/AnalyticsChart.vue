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
  watch: {
    metrics: {
      deep: true,
      handler (nextMetrics) {
        if (this._chart) {
          this._chart.update(nextMetrics || [])
        }
      }
    }
  },
  created () {
    this._alive = false
    this._chart = null
    this._chartPromise = null
    this._chartVersion = 0
    this._abortController = null
    this._resizeObserver = null
    this._resizeFrame = 0
    this._usingWindowResize = false
  },
  mounted () {
    this._alive = true
    this.bindResize()
    this.ensureChart()
  },
  activated () {
    if (!this._alive) return
    this.bindResize()
    this.ensureChart()
  },
  deactivated () {
    this.teardownRuntime()
  },
  beforeDestroy () {
    this._alive = false
    this.teardownRuntime()
  },
  methods: {
    ensureChart () {
      const element = this.$refs.chart
      if (!this._alive || !element || this._chart || this._chartPromise) return

      const version = ++this._chartVersion
      const controller = typeof AbortController === 'function'
        ? new AbortController()
        : null
      this._abortController = controller

      const pending = Promise.resolve().then(() => createChart(
        element,
        this.metrics || [],
        {
          signal: controller ? controller.signal : null,
          onSelect: (detail) => {
            if (this._alive && version === this._chartVersion) {
              this.$emit('select', detail)
            }
          }
        }
      ))

      this._chartPromise = pending
      pending.then((chart) => {
        if (!chart) return
        if (!this._alive || version !== this._chartVersion || element !== this.$refs.chart) {
          chart.destroy()
          return
        }
        this._chart = chart
        chart.update(this.metrics || [])
        chart.resize()
      }).catch((error) => {
        if (this._alive && version === this._chartVersion) {
          this.$emit('error', error)
        }
      }).finally(() => {
        if (this._chartPromise === pending) this._chartPromise = null
        if (this._abortController === controller) this._abortController = null
      })
    },
    bindResize () {
      const element = this.$refs.chart
      if (!element || this._resizeObserver || this._usingWindowResize) return

      if (typeof ResizeObserver === 'function') {
        this._resizeObserver = new ResizeObserver(() => this.scheduleResize())
        this._resizeObserver.observe(element)
      } else if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.scheduleResize)
        this._usingWindowResize = true
      }
    },
    unbindResize () {
      if (this._resizeObserver) {
        this._resizeObserver.disconnect()
        this._resizeObserver = null
      }
      if (this._usingWindowResize && typeof window !== 'undefined') {
        window.removeEventListener('resize', this.scheduleResize)
        this._usingWindowResize = false
      }
      if (this._resizeFrame) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this._resizeFrame)
        }
        this._resizeFrame = 0
      }
    },
    scheduleResize () {
      if (!this._alive || this._resizeFrame) return
      if (typeof requestAnimationFrame !== 'function') {
        if (this._chart) this._chart.resize()
        return
      }
      this._resizeFrame = requestAnimationFrame(() => {
        this._resizeFrame = 0
        if (this._alive && this._chart) this._chart.resize()
      })
    },
    teardownRuntime () {
      ++this._chartVersion
      if (this._abortController) {
        this._abortController.abort()
        this._abortController = null
      }
      this._chartPromise = null
      if (this._chart) {
        this._chart.destroy()
        this._chart = null
      }
      this.unbindResize()
    }
  }
}
</script>

<style>
.analytics-chart {
  display: flex;
  box-sizing: border-box;
  gap: 12px;
  min-width: 100%;
  width: max-content;
  padding: 4px;
}

.analytics-chart__metric {
  position: relative;
  display: grid;
  flex: 0 0 168px;
  grid-template-rows: auto auto 4px;
  gap: 8px;
  box-sizing: border-box;
  overflow: hidden;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #111827;
  text-align: left;
  cursor: pointer;
}

.analytics-chart__metric:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.analytics-chart__label {
  color: #6b7280;
  font-size: 13px;
}

.analytics-chart__value {
  font-size: 22px;
  font-weight: 600;
}

.analytics-chart__bar-track {
  overflow: hidden;
  border-radius: 2px;
  background: #e5e7eb;
}

.analytics-chart__bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}
</style>
