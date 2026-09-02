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
      handler (metrics) {
        if (this.chartInstance) {
          this.chartInstance.update(metrics)
        }
      }
    }
  },
  mounted () {
    this.chartDisposed = false
    this.chartGeneration = 0
    this.mountChart()
  },
  beforeDestroy () {
    this.chartDisposed = true
    this.chartGeneration += 1
    this.disconnectResizeObserver()
    this.destroyChart()
  },
  methods: {
    async mountChart () {
      const generation = ++this.chartGeneration
      let instance

      try {
        instance = await createChart(this.$refs.chart, this.metrics, {
          onSelect: (detail) => {
            if (!this.chartDisposed && generation === this.chartGeneration) {
              this.$emit('select', detail)
            }
          }
        })
      } catch (error) {
        if (!this.chartDisposed && generation === this.chartGeneration) {
          this.$emit('error', error)
        }
        return
      }

      if (this.chartDisposed || generation !== this.chartGeneration) {
        instance.destroy()
        return
      }

      this.chartInstance = instance
      this.chartInstance.update(this.metrics)
      this.observeChartSize(generation)
    },
    observeChartSize (generation) {
      if (typeof ResizeObserver === 'undefined' || !this.$refs.chart) return

      this.disconnectResizeObserver()
      this.resizeObserver = new ResizeObserver(() => {
        if (
          !this.chartDisposed &&
          generation === this.chartGeneration &&
          this.chartInstance
        ) {
          this.chartInstance.resize()
        }
      })
      this.resizeObserver.observe(this.$refs.chart)
    },
    disconnectResizeObserver () {
      if (!this.resizeObserver) return
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    },
    destroyChart () {
      if (!this.chartInstance) return
      this.chartInstance.destroy()
      this.chartInstance = null
    }
  }
}
</script>

<style>
.analytics-chart {
  min-width: 100%;
  min-height: 160px;
}

.analytics-chart__plot {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  min-width: max-content;
  min-height: 160px;
  padding: 12px;
  box-sizing: border-box;
}

.analytics-chart__metric {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 96px;
  min-height: 112px;
  padding: 12px;
  border: 0;
  border-radius: 8px;
  color: #1f2937;
  background: #eef4ff;
  cursor: pointer;
}

.analytics-chart__metric-label {
  margin-bottom: 8px;
  font-size: 13px;
}

.analytics-chart__metric-value {
  font-size: 22px;
  font-weight: 600;
}
</style>
