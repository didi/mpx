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
      default: function () { return [] }
    }
  },
  data: function () {
    return {
      chart: null,
      resizeObserver: null,
      renderVersion: 0,
      isDisposed: false
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler: function (nextMetrics) {
        if (this.chart) {
          this.chart.update(nextMetrics || [])
        } else {
          this.mountChart()
        }
      }
    }
  },
  mounted: function () {
    this.mountChart()
    this.observeSize()
  },
  beforeDestroy: function () {
    this.isDisposed = true
    this.renderVersion += 1
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
    async mountChart () {
      var version = ++this.renderVersion
      var element = this.$refs.chart
      if (!element || this.isDisposed) return

      var nextChart = await createChart(element, this.metrics || [], {
        onSelect: this.handleSelect
      })

      // An async factory may finish after this component has been replaced.
      if (this.isDisposed || version !== this.renderVersion || element !== this.$refs.chart) {
        nextChart.destroy()
        return
      }

      if (this.chart) this.chart.destroy()
      this.chart = nextChart
    },
    observeSize: function () {
      var element = this.$refs.chart
      if (!element || typeof ResizeObserver === 'undefined') return
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isDisposed && this.chart) this.chart.resize()
      })
      this.resizeObserver.observe(element)
    },
    handleSelect: function (key) {
      this.$emit('select', { key: key })
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  min-width: max-content;
}
</style>
