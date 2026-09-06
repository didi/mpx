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
      chartGeneration: 0,
      isChartMounted: false,
      resizeObserver: null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (nextMetrics) {
        if (!this.isChartMounted) return

        if (!this.chartInstance) {
          this.initializeChart()
          return
        }

        const generation = ++this.chartGeneration
        const resourceKey = this.getResourceKey(nextMetrics)
        const instance = this.chartInstance

        instance.update(this.normalizedMetrics(nextMetrics))
        this.bindResizeObserver(instance, generation, resourceKey)
      }
    }
  },
  mounted () {
    this.isChartMounted = true
    this.initializeChart()
  },
  beforeDestroy () {
    this.isChartMounted = false
    this.chartGeneration += 1
    this.releaseChart()
  },
  methods: {
    normalizedMetrics (metrics) {
      return Array.isArray(metrics) ? metrics : []
    },
    getResourceKey (metrics) {
      return this.normalizedMetrics(metrics)
        .map((item) => String(item && item.key != null ? item.key : ''))
        .join('\u001f')
    },
    isCurrentInitialization (generation, resourceKey) {
      return this.isChartMounted &&
        this.chartGeneration === generation &&
        this.getResourceKey(this.metrics) === resourceKey
    },
    async initializeChart () {
      const element = this.$refs.chart
      if (!this.isChartMounted || !element) return

      const generation = ++this.chartGeneration
      const metrics = this.normalizedMetrics(this.metrics).slice()
      const resourceKey = this.getResourceKey(metrics)
      let candidate = null

      try {
        candidate = await createChart(element, metrics, {
          isCurrent: () => this.isCurrentInitialization(generation, resourceKey),
          onSelect: (detail) => {
            if (!this.isChartMounted || this.chartInstance !== candidate) return
            this.$emit('select', { detail })
          }
        })
      } catch (error) {
        if (this.isCurrentInitialization(generation, resourceKey)) {
          this.$emit('error', error)
        }
        return
      }

      if (!this.isCurrentInitialization(generation, resourceKey)) {
        if (candidate && candidate.destroy) candidate.destroy()
        return
      }

      this.releaseChart()
      this.chartInstance = candidate
      candidate.update(this.normalizedMetrics(this.metrics))
      this.bindResizeObserver(candidate, generation, resourceKey)
    },
    bindResizeObserver (instance, generation, resourceKey) {
      this.releaseResizeObserver()
      if (typeof ResizeObserver === 'undefined' || !this.$refs.chart) return

      const observer = new ResizeObserver(() => {
        if (!this.isCurrentInitialization(generation, resourceKey) ||
          this.chartInstance !== instance ||
          this.resizeObserver !== observer) return
        instance.resize()
      })

      this.resizeObserver = observer
      observer.observe(this.$refs.chart)
    },
    releaseResizeObserver () {
      const observer = this.resizeObserver
      this.resizeObserver = null
      if (observer) observer.disconnect()
    },
    releaseChart () {
      this.releaseResizeObserver()
      const instance = this.chartInstance
      this.chartInstance = null
      if (instance && instance.destroy) instance.destroy()
    }
  }
}
</script>

<style>
.analytics-chart {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-width: max-content;
  min-height: 180px;
}

.analytics-chart__metric {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 140px;
  min-height: 160px;
  padding: 12px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  background: #fff;
  color: #263142;
  cursor: pointer;
  flex-direction: column;
  justify-content: flex-end;
  text-align: left;
}

.analytics-chart__metric:focus-visible {
  outline: 2px solid #3478f6;
  outline-offset: 2px;
}

.analytics-chart__bar-track {
  display: flex;
  height: 92px;
  margin-bottom: 10px;
  border-radius: 4px 4px 0 0;
  background: #edf3ff;
  align-items: flex-end;
  overflow: hidden;
}

.analytics-chart__bar {
  display: block;
  width: 100%;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: #3478f6;
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
  margin-top: 4px;
  font-size: 20px;
  font-weight: 600;
}
</style>
