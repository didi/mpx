<template>
  <div ref="chart" class="analytics-chart" role="img" aria-label="Analytics chart"></div>
</template>

<script>
import { createChart } from './chart-sdk'

export default {
  name: 'AnalyticsChart',
  props: {
    metrics: { type: Array, default: () => [] }
  },
  data () {
    return {
      chart: null,
      chartPromise: null,
      pendingLifecycle: null,
      generation: 0,
      resizeObserver: null,
      destroyedByLifecycle: false
    }
  },
  mounted () {
    this.initializeChart()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart && !this.destroyedByLifecycle) this.chart.resize()
      })
      this.resizeObserver.observe(this.$refs.chart)
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics)
        else this.initializeChart()
      }
    }
  },
  beforeDestroy () {
    this.destroyedByLifecycle = true
    this.generation += 1
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.chart) this.chart.destroy()
    if (this.pendingLifecycle) this.pendingLifecycle.cancelled = true
    this.chart = null
  },
  methods: {
    initializeChart () {
      const generation = ++this.generation
      const element = this.$refs.chart
      const lifecycle = { cancelled: false }
      if (this.pendingLifecycle) this.pendingLifecycle.cancelled = true
      this.pendingLifecycle = lifecycle
      this.chartPromise = createChart(element, this.metrics, {
        lifecycle,
        onSelect: (key) => this.$emit('select', { key })
      }).then((chart) => {
        if (this.pendingLifecycle === lifecycle) this.pendingLifecycle = null
        if (!chart) return
        if (this.destroyedByLifecycle || generation !== this.generation) {
          chart.destroy()
          return
        }
        this.chart = chart
      })
    }
  }
}
</script>

<style scoped>
.analytics-chart { min-width: 100%; min-height: 180px; padding: 16px; box-sizing: border-box; }
</style>
