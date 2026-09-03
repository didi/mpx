<template>
  <section class="analytics-chart" aria-label="数据指标图表">
    <div ref="chart" class="analytics-chart__canvas" aria-live="polite"></div>
    <div class="analytics-chart__metrics">
      <button
        v-for="metric in safeMetrics"
        :id="metric.key"
        :key="metric.key"
        type="button"
        class="analytics-chart__metric"
        @click="selectMetric(metric.key)"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </button>
    </div>
  </section>
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
      chartRevision: 0,
      disposed: false,
      resizeObserver: null
    }
  },
  computed: {
    safeMetrics () {
      return Array.isArray(this.metrics) ? this.metrics : []
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler () {
        this.renderChart()
      }
    }
  },
  mounted () {
    this.disposed = false
    this.createResizeObserver()
    this.renderChart()
  },
  beforeDestroy () {
    this.disposed = true
    this.chartRevision += 1
    this.destroyChart()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    createResizeObserver () {
      if (typeof ResizeObserver === 'undefined' || !this.$refs.chart) return
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.disposed && this.chart && this.chart.resize) this.chart.resize()
      })
      this.resizeObserver.observe(this.$refs.chart)
    },
    async renderChart () {
      const revision = ++this.chartRevision
      const element = this.$refs.chart
      const metrics = this.safeMetrics.slice()
      if (!element || this.disposed) return

      if (this.chart) {
        this.chart.update(metrics)
        return
      }

      const nextChart = await createChart(element, metrics)
      if (this.disposed || revision !== this.chartRevision || element !== this.$refs.chart) {
        if (nextChart && nextChart.destroy) nextChart.destroy()
        return
      }
      this.chart = nextChart
    },
    destroyChart () {
      if (!this.chart) return
      if (this.chart.destroy) this.chart.destroy()
      this.chart = null
    },
    selectMetric (key) {
      this.$emit('select', { key })
    }
  }
}
</script>

<style scoped>
.analytics-chart__canvas {
  min-height: 40px;
}

.analytics-chart__metrics {
  display: flex;
  gap: 8px;
}

.analytics-chart__metric {
  flex: 0 0 auto;
}
</style>
