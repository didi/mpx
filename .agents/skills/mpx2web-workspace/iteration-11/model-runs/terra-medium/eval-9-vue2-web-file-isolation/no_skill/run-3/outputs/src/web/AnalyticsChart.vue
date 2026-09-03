<template>
  <section class="analytics-chart" aria-label="Analytics chart">
    <div ref="canvas" class="analytics-chart__canvas"></div>
    <div class="analytics-chart__metrics">
      <button
        v-for="metric in safeMetrics"
        :id="metricId(metric)"
        :key="metric.key"
        type="button"
        class="analytics-chart__metric"
        @click="selectMetric(metric)"
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
      default: function () { return [] }
    }
  },
  data: function () {
    return {
      chart: null,
      generation: 0,
      resizeObserver: null
    }
  },
  computed: {
    safeMetrics: function () {
      return Array.isArray(this.metrics) ? this.metrics : []
    }
  },
  watch: {
    safeMetrics: {
      deep: true,
      handler: function (metrics) {
        if (this.chart) this.chart.update(metrics)
      }
    }
  },
  mounted: function () {
    this.mountChart()
  },
  beforeDestroy: function () {
    this.generation += 1
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.resizeObserver = null
    if (this.chart) this.chart.destroy()
    this.chart = null
  },
  methods: {
    mountChart: function () {
      const generation = ++this.generation
      const element = this.$refs.canvas
      createChart(element, this.safeMetrics).then((chart) => {
        // The component may have been left and mounted again while the SDK loaded.
        if (generation !== this.generation || this._isBeingDestroyed || this._isDestroyed) {
          chart.destroy()
          return
        }
        this.chart = chart
        chart.update(this.safeMetrics)
        this.observeResize()
      }).catch(() => {
        // A failed or cancelled lazy chart must not leave an old instance active.
      })
    },
    observeResize: function () {
      if (typeof ResizeObserver === 'undefined' || this.resizeObserver) return
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) this.chart.resize()
      })
      this.resizeObserver.observe(this.$el)
    },
    metricId: function (metric) {
      return String(metric.key)
    },
    selectMetric: function (metric) {
      this.$emit('select', { key: metric.key })
    }
  }
}
</script>

<style scoped>
.analytics-chart { min-width: max-content; }
.analytics-chart__canvas { min-height: 112px; }
.analytics-chart__metrics { display: flex; gap: 8px; padding-top: 12px; }
.analytics-chart__metric { cursor: pointer; }
</style>
