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
      chart: null,
      resizeObserver: null,
      chartDetached: false
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics)
      }
    }
  },
  mounted () {
    this.mountChart()
  },
  beforeDestroy () {
    this.chartDetached = true
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
      const chart = await createChart(this.$refs.chart, this.metrics, (key) => {
        this.$emit('select', { key })
      })
      if (this.chartDetached) {
        chart.destroy()
        return
      }
      this.chart = chart
      this.chart.update(this.metrics)
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.chart === chart) chart.resize()
        })
        this.resizeObserver.observe(this.$refs.chart)
      }
    }
  }
}
</script>

<style>
.analytics-chart {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.analytics-chart__metric {
  border: 0;
  border-radius: 4px;
  padding: 8px 12px;
  background: #f2f4f7;
  color: #1f2329;
  cursor: pointer;
}
</style>
