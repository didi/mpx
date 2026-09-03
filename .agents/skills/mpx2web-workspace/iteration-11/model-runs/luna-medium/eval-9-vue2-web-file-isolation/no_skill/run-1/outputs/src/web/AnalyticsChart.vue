<template>
  <div ref="chart" class="analytics-chart" role="list"></div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: {
    metrics: { type: Array, default: () => [] }
  },
  data () {
    return { chart: null, initToken: 0, disposed: false }
  },
  computed: {
    safeMetrics () {
      return Array.isArray(this.metrics) ? this.metrics : []
    }
  },
  mounted () {
    this.initChart()
  },
  beforeDestroy () {
    this.disposed = true
    this.initToken += 1
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (value) {
        if (this.chart) this.chart.update(Array.isArray(value) ? value : [])
        else this.initChart()
      }
    }
  },
  methods: {
    initChart () {
      const token = ++this.initToken
      const element = this.$refs.chart
      createChart(element, this.safeMetrics, {
        onSelect: key => this.selectMetric(key)
      }).then(chart => {
        if (this.disposed || token !== this.initToken) chart.destroy()
        else this.chart = chart
      })
    },
    selectMetric (key) {
      this.$emit('select', { key })
    },
    resize () {
      if (this.chart) this.chart.resize()
    }
  }
}
</script>
