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
        if (this._chartInstance) {
          this._chartInstance.update(this.snapshotMetrics(metrics))
          return
        }
        if (this._chartMounted) this.createChartInstance(metrics)
      }
    }
  },
  created () {
    this._chartMounted = false
    this._chartGeneration = 0
    this._chartInstance = null
    this._resizeObserver = null
  },
  mounted () {
    this._chartMounted = true
    this.createChartInstance(this.metrics)
  },
  beforeDestroy () {
    this._chartMounted = false
    this._chartGeneration += 1
    this.releaseChartResources()
  },
  methods: {
    snapshotMetrics (metrics) {
      if (!Array.isArray(metrics)) return []
      return metrics.map((item) => ({ ...item }))
    },
    isCurrentChart (generation, element) {
      return this._chartMounted &&
        this._chartGeneration === generation &&
        this.$refs.chart === element
    },
    async createChartInstance (metrics) {
      const generation = this._chartGeneration + 1
      this._chartGeneration = generation
      const element = this.$refs.chart
      const metricSnapshot = this.snapshotMetrics(metrics)
      if (!element) return

      let instance
      try {
        instance = await createChart(element, metricSnapshot, {
          isCurrent: () => this.isCurrentChart(generation, element),
          onSelect: (detail) => {
            if (!this.isCurrentChart(generation, element) ||
              this._chartInstance !== instance) return
            this.$emit('select', detail)
          }
        })
      } catch (error) {
        if (this.isCurrentChart(generation, element)) {
          this.$emit('error', error)
        }
        return
      }

      if (!this.isCurrentChart(generation, element)) {
        if (instance && instance.destroy) instance.destroy()
        if (this._chartInstance) {
          this._chartInstance.update(this.snapshotMetrics(this.metrics))
        }
        return
      }

      this.releaseChartResources()
      this._chartInstance = instance
      this.observeChartSize(generation, element, instance)
    },
    observeChartSize (generation, element, instance) {
      if (typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(() => {
        if (!this.isCurrentChart(generation, element) ||
          this._chartInstance !== instance ||
          this._resizeObserver !== observer) return
        instance.resize()
      })
      this._resizeObserver = observer
      observer.observe(element)
    },
    releaseChartResources () {
      const observer = this._resizeObserver
      const instance = this._chartInstance
      this._resizeObserver = null
      this._chartInstance = null
      if (observer) observer.disconnect()
      if (instance && instance.destroy) instance.destroy()
    }
  }
}
</script>

<style>
.analytics-chart {
  min-width: 100%;
  min-height: 100%;
}

.analytics-chart__content {
  display: flex;
  gap: 12px;
}

.analytics-chart__metric {
  flex: 0 0 auto;
  padding: 12px 16px;
  border: 0;
  border-radius: 8px;
  color: inherit;
  background: #f5f7fa;
  cursor: pointer;
}
</style>
