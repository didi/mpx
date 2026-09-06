<template>
  <div class="analytics-chart">
    <div ref="chartSurface" class="analytics-chart__surface" aria-hidden="true"></div>
    <button
      v-for="metric in metrics"
      :id="metric.id || metric.key"
      :key="metric.key"
      type="button"
      class="analytics-chart__metric"
      @click="selectMetric(metric.key)"
    >
      <span class="analytics-chart__label">{{ metric.label }}</span>
      <span class="analytics-chart__value">{{ metric.value }}</span>
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
  watch: {
    metrics: {
      deep: true,
      handler (nextMetrics) {
        if (this.chart) this.chart.update(nextMetrics || [])
      }
    }
  },
  mounted () {
    this.destroyed = false
    this.mountChart()
  },
  beforeDestroy () {
    this.destroyed = true
    this.chartGeneration += 1
    this.releaseChart()
  },
  methods: {
    isCurrentChart (generation) {
      return !this.destroyed && this.chartGeneration === generation
    },
    async mountChart () {
      const generation = this.chartGeneration + 1
      this.chartGeneration = generation
      const surface = this.$refs.chartSurface
      const chart = await createChart(surface, this.metrics || [])

      if (!this.isCurrentChart(generation) || this.$refs.chartSurface !== surface) {
        if (chart && chart.destroy) chart.destroy()
        return
      }

      this.releaseChart()
      this.chart = chart
      chart.update(this.metrics || [])
      this.bindResizeObserver(generation, chart, surface)
    },
    bindResizeObserver (generation, chart, surface) {
      if (typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(() => {
        if (!this.isCurrentChart(generation) || this.chart !== chart || this.resizeObserver !== observer) return
        chart.resize()
      })
      this.resizeObserver = observer
      observer.observe(surface)
    },
    releaseChart () {
      const observer = this.resizeObserver
      this.resizeObserver = null
      if (observer) observer.disconnect()

      const chart = this.chart
      this.chart = null
      if (chart && chart.destroy) chart.destroy()
    },
    selectMetric (key) {
      this.$emit('select', { key })
    }
  }
}
</script>

<style scoped>
.analytics-chart__surface {
  min-height: 1px;
}

.analytics-chart__metric {
  display: block;
  width: 100%;
}
</style>
