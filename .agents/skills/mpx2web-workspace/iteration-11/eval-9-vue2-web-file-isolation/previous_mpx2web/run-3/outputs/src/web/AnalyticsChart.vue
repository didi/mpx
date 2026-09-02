<template>
  <div ref="chart" class="analytics-chart" role="list" />
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
        if (this.chartInstance) {
          this.chartInstance.update(nextMetrics)
        }
      }
    }
  },
  created () {
    this.chartInstance = null
    this.resizeObserver = null
    this.initVersion = 0
    this.disposed = false
  },
  mounted () {
    this.disposed = false
    const version = ++this.initVersion
    this.initializeChart(version)
  },
  beforeDestroy () {
    this.disposed = true
    this.initVersion += 1
    this.disconnectResizeObserver()

    const chart = this.chartInstance
    this.chartInstance = null
    if (chart) {
      chart.destroy()
    }
  },
  methods: {
    async initializeChart (version) {
      let chart
      try {
        chart = await createChart(this.$refs.chart, this.metrics, {
          onSelect: (key) => {
            if (!this.disposed) {
              this.$emit('select', { key })
            }
          }
        })
      } catch (error) {
        if (!this.disposed && version === this.initVersion) {
          this.$emit('error', error)
        }
        return
      }

      if (this.disposed || version !== this.initVersion) {
        chart.destroy()
        return
      }

      this.chartInstance = chart
      chart.update(this.metrics)
      this.observeChartSize()
      chart.resize()
    },
    observeChartSize () {
      this.disconnectResizeObserver()
      if (typeof ResizeObserver === 'undefined' || !this.$refs.chart) return

      this.resizeObserver = new ResizeObserver(() => {
        if (!this.disposed && this.chartInstance) {
          this.chartInstance.resize()
        }
      })
      this.resizeObserver.observe(this.$refs.chart)
    },
    disconnectResizeObserver () {
      if (!this.resizeObserver) return
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  }
}
</script>

<style>
.analytics-chart {
  box-sizing: border-box;
  display: flex;
  min-width: 100%;
  min-height: 100%;
  gap: 12px;
  padding: 12px;
  align-items: stretch;
}

.analytics-chart__metric {
  box-sizing: border-box;
  flex: 0 0 180px;
}

.analytics-chart__button {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 112px;
  padding: 14px;
  border: 1px solid #dbe4f0;
  border-radius: 10px;
  background: #fff;
  color: #17233d;
  cursor: pointer;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
}

.analytics-chart__button:focus-visible {
  outline: 2px solid #3478f6;
  outline-offset: 2px;
}

.analytics-chart__label {
  overflow: hidden;
  color: #667085;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analytics-chart__value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.analytics-chart__bar {
  overflow: hidden;
  height: 6px;
  margin-top: auto;
  border-radius: 999px;
  background: #edf2f7;
}

.analytics-chart__bar-value {
  height: 100%;
  border-radius: inherit;
  background: #3478f6;
}
</style>
