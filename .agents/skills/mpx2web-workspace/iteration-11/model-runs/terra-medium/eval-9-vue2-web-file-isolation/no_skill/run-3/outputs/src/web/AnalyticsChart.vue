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
      default: function () {
        return []
      }
    }
  },
  data: function () {
    return {
      chart: null,
      disposed: false,
      chartRequest: 0,
      resizeObserver: null,
      removeWindowResize: null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler: function (metrics) {
        if (this.chart) this.chart.update(metrics)
      }
    }
  },
  mounted: function () {
    this.createChart()
  },
  beforeDestroy: function () {
    this.disposed = true
    this.chartRequest += 1
    this.stopObserving()
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  methods: {
    createChart: function () {
      var self = this
      var request = ++this.chartRequest
      createChart(this.$refs.chart, this.metrics, {
        isActive: function () {
          return !self.disposed && self.chartRequest === request
        },
        onSelect: function (detail) {
          if (!self.disposed && self.chartRequest === request) self.$emit('select', detail)
        }
      }).then(function (chart) {
        if (self.disposed || self.chartRequest !== request) {
          chart.destroy()
          return
        }
        self.chart = chart
        // Props may have changed while the asynchronous chart was being created.
        chart.update(self.metrics)
        self.startObserving()
      })
    },
    startObserving: function () {
      var self = this
      var resize = function () {
        if (!self.disposed && self.chart) self.chart.resize()
      }
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(resize)
        this.resizeObserver.observe(this.$refs.chart)
      } else if (typeof window !== 'undefined') {
        window.addEventListener('resize', resize)
        this.removeWindowResize = function () {
          window.removeEventListener('resize', resize)
        }
      }
    },
    stopObserving: function () {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      if (this.removeWindowResize) {
        this.removeWindowResize()
        this.removeWindowResize = null
      }
    }
  }
}
</script>
