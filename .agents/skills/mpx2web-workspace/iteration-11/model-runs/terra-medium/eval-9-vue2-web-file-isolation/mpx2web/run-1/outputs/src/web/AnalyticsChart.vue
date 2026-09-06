<template>
  <section class="analytics-chart">
    <div ref="chart" class="analytics-chart__canvas" aria-label="指标图表"></div>
    <button
      v-for="metric in normalizedMetrics"
      :id="metricId(metric)"
      :key="metric.key"
      class="analytics-chart__metric"
      type="button"
      @click="selectMetric(metric.key)"
    >
      <span>{{ metric.label }}</span>
      <strong>{{ metric.value }}</strong>
    </button>
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
      destroyed: false,
      generation: 0,
      resizeObserver: null
    }
  },
  computed: {
    normalizedMetrics () {
      return this.metrics || []
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        this.updateChart(metrics || [])
      }
    }
  },
  mounted () {
    this.destroyed = false
    this.createChart(this.normalizedMetrics)
  },
  beforeDestroy () {
    this.destroyed = true
    this.releaseChart()
  },
  methods: {
    isCurrent (generation) {
      return !this.destroyed && this.generation === generation
    },
    releaseChart () {
      this.generation += 1
      const observer = this.resizeObserver
      this.resizeObserver = null
      if (observer) observer.disconnect()
      const chart = this.chart
      this.chart = null
      if (chart && chart.destroy) chart.destroy()
    },
    async createChart (metrics) {
      this.releaseChart()
      const generation = this.generation
      const element = this.$refs.chart
      if (!element) return
      const chart = await createChart(element, metrics)
      if (!this.isCurrent(generation) || this.$refs.chart !== element) {
        if (chart && chart.destroy) chart.destroy()
        return
      }
      this.chart = chart
      if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(() => {
          if (!this.isCurrent(generation) || this.chart !== chart || this.resizeObserver !== observer) return
          if (chart.resize) chart.resize()
        })
        this.resizeObserver = observer
        observer.observe(element)
      }
    },
    updateChart (metrics) {
      const chart = this.chart
      if (chart && chart.update) {
        chart.update(metrics)
      } else if (!this.destroyed && this.$el) {
        this.createChart(metrics)
      }
    },
    metricId (metric) {
      return String(metric.key)
    },
    selectMetric (key) {
      this.$emit('select', { key })
    }
  }
}
</script>

<style scoped>
.analytics-chart { display: grid; gap: 12px; min-width: max-content; }
.analytics-chart__canvas { min-height: 120px; }
.analytics-chart__metric { display: flex; justify-content: space-between; gap: 16px; }
</style>
