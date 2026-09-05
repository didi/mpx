<template>
  <div class="analytics-chart">
    <div ref="canvas" class="analytics-chart__canvas" />
    <button
      v-for="metric in metricList"
      :id="metric.key"
      :key="metric.key"
      type="button"
      class="analytics-chart__metric"
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
      chartRequest: 0,
      resizeObserver: null,
      isAlive: false
    }
  },
  computed: {
    metricList () {
      return Array.isArray(this.metrics) ? this.metrics : []
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler () {
        if (this.chart) this.chart.update(this.metricList)
      }
    }
  },
  mounted () {
    this.isAlive = true
    this.createChart()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) this.chart.resize()
      })
      this.resizeObserver.observe(this.$el)
    }
  },
  beforeDestroy () {
    this.isAlive = false
    this.chartRequest += 1
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  methods: {
    createChart () {
      const request = ++this.chartRequest
      createChart(this.$refs.canvas, this.metricList, {
        isCurrent: () => this.isAlive && request === this.chartRequest
      }).then((chart) => {
        if (!chart) return
        if (!this.isAlive || request !== this.chartRequest) {
          chart.destroy()
          return
        }
        this.chart = chart
        this.chart.update(this.metricList)
      })
    },
    selectMetric (key) {
      this.$emit('select', { key })
    }
  }
}
</script>
