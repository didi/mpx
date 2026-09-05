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
      resizeListenerAttached: false,
      initGeneration: 0,
      isDisposed: false
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart && this.chart.update) {
          this.chart.update(metrics || [])
        }
      }
    }
  },
  mounted () {
    this.isDisposed = false
    this.observeSize()
    this.initChart()
  },
  beforeDestroy () {
    this.isDisposed = true
    this.initGeneration += 1

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.resizeListenerAttached) {
      window.removeEventListener('resize', this.handleResize)
      this.resizeListenerAttached = false
    }
    if (this.chart && this.chart.destroy) {
      this.chart.destroy()
    }
    this.chart = null
  },
  methods: {
    async initChart () {
      const generation = ++this.initGeneration
      let chart

      try {
        chart = await createChart(this.$refs.chart, this.metrics || [], {
          onSelect: (key) => {
            if (!this.isDisposed && generation === this.initGeneration) {
              this.$emit('select', { key })
            }
          }
        })
      } catch (error) {
        if (!this.isDisposed && generation === this.initGeneration) {
          this.$emit('error', error)
        }
        return
      }

      if (this.isDisposed || generation !== this.initGeneration) {
        if (chart && chart.destroy) chart.destroy()
        return
      }

      if (this.chart && this.chart.destroy) this.chart.destroy()
      this.chart = chart
      if (this.chart && this.chart.update) {
        this.chart.update(this.metrics || [])
      }
      this.handleResize()
    },
    observeSize () {
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.handleResize)
        this.resizeObserver.observe(this.$refs.chart)
        return
      }

      window.addEventListener('resize', this.handleResize)
      this.resizeListenerAttached = true
    },
    handleResize () {
      if (!this.isDisposed && this.chart && this.chart.resize) {
        this.chart.resize()
      }
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  box-sizing: border-box;
  display: inline-block;
  min-width: 100%;
  vertical-align: top;
  white-space: nowrap;
}
</style>
