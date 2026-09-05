<template>
  <div ref="chart" class="analytics-chart"></div>
</template>

<script>
import { createChart } from './chart-sdk'

function snapshotMetrics (metrics) {
  return (metrics || []).map((item) => ({ ...item }))
}

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
      resizeObserver: null,
      chartGeneration: 0,
      chartDestroyed: false
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler () {
        this.syncChart()
      }
    }
  },
  mounted () {
    this.chartDestroyed = false

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.chartDestroyed && this.chartInstance) {
          this.chartInstance.resize()
        }
      })
      this.resizeObserver.observe(this.$refs.chart)
    }

    this.syncChart()
  },
  beforeDestroy () {
    this.chartDestroyed = true
    this.chartGeneration += 1

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.chartInstance) {
      this.chartInstance.destroy()
      this.chartInstance = null
    }
  },
  methods: {
    async syncChart () {
      const element = this.$refs.chart
      if (!element || this.chartDestroyed) return

      const generation = ++this.chartGeneration
      const metrics = snapshotMetrics(this.metrics)

      if (this.chartInstance) {
        this.chartInstance.update(metrics)
        return
      }

      const instance = await createChart(element, metrics, {
        onSelect: (key) => {
          if (!this.chartDestroyed) {
            this.$emit('select', { detail: { key } })
          }
        }
      })

      if (
        this.chartDestroyed ||
        generation !== this.chartGeneration ||
        element !== this.$refs.chart
      ) {
        instance.destroy()
        return
      }

      this.chartInstance = instance
      this.chartInstance.resize()
    }
  }
}
</script>

<style>
.analytics-chart {
  display: flex;
  min-width: 100%;
  min-height: 100%;
}

.analytics-chart__content {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-width: max-content;
  padding: 8px;
  box-sizing: border-box;
}

.analytics-chart__metric {
  display: grid;
  grid-template-rows: auto auto 6px;
  gap: 6px;
  min-width: 120px;
  padding: 12px;
  border: 1px solid #dfe5ec;
  border-radius: 8px;
  color: #1f2d3d;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.analytics-chart__metric:focus-visible {
  outline: 2px solid #3478f6;
  outline-offset: 2px;
}

.analytics-chart__label {
  color: #667085;
  font-size: 13px;
}

.analytics-chart__value {
  font-size: 20px;
  font-weight: 600;
}

.analytics-chart__bar {
  display: block;
  min-width: 2px;
  height: 6px;
  border-radius: 3px;
  background: #3478f6;
}
</style>
