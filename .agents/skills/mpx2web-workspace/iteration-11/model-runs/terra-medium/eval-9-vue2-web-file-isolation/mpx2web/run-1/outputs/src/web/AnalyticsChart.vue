<template>
  <div class="analytics-chart">
    <div ref="chart" class="analytics-chart__plot"></div>
    <button
      v-for="metric in safeMetrics"
      :id="metric.key"
      :key="metric.key"
      class="analytics-chart__metric"
      type="button"
      @click="selectMetric(metric.key)"
    >
      <span>{{ metric.label }}</span>
      <span>{{ metric.value }}</span>
    </button>
  </div>
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
      chartGeneration: 0,
      destroyed: false,
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
    this.installResizeObserver()
    this.renderChart()
  },
  beforeDestroy () {
    this.destroyed = true
    this.chartGeneration += 1
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    this.destroyChart()
  },
  methods: {
    async renderChart () {
      if (this.destroyed || !this.$refs.chart) return

      if (this.chart) {
        this.chart.update(this.safeMetrics)
        return
      }

      const generation = ++this.chartGeneration
      const nextMetrics = this.safeMetrics.slice()
      const chart = await createChart(this.$refs.chart, nextMetrics)

      if (this.destroyed || generation !== this.chartGeneration) {
        chart.destroy()
        return
      }

      this.destroyChart()
      this.chart = chart
    },
    destroyChart () {
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    },
    installResizeObserver () {
      if (typeof ResizeObserver === 'undefined' || !this.$refs.chart) return
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) this.chart.resize()
      })
      this.resizeObserver.observe(this.$refs.chart)
    },
    selectMetric (key) {
      this.$emit('select', { key })
    }
  }
}
</script>
