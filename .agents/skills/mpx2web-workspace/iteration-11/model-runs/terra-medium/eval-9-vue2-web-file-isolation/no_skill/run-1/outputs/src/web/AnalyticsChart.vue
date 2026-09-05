<template>
  <div ref="chart" class="analytics-chart" />
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
      disposed: false,
      generation: 0,
      resizeObserver: null,
      resizeListener: null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) this.chart.update(metrics || [])
      }
    }
  },
  mounted () {
    this.createChart()
    this.observeSize()
  },
  beforeDestroy () {
    this.disposed = true
    this.generation += 1
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener)
    }
    if (this.chart) this.chart.destroy()
    this.chart = null
  },
  methods: {
    createChart () {
      const generation = ++this.generation
      const element = this.$refs.chart
      if (!element) return

      createChart(element, this.metrics || [], {
        isCancelled: () => this.disposed || generation !== this.generation,
        onSelect: (key) => this.$emit('select', { key })
      }).then((chart) => {
        // A previous route/component can resolve after this one has gone away.
        if (this.disposed || generation !== this.generation) {
          chart.destroy()
          return
        }
        this.chart = chart
        chart.update(this.metrics || [])
        chart.resize()
      }).catch((error) => {
        // Ignore cancellation; surface genuine chart failures to the host app.
        if (!this.disposed && generation === this.generation) this.$emit('error', error)
      })
    },
    observeSize () {
      const element = this.$refs.chart
      if (!element) return
      const resize = () => {
        if (!this.disposed && this.chart) this.chart.resize()
      }
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(resize)
        this.resizeObserver.observe(element)
      } else if (typeof window !== 'undefined') {
        this.resizeListener = resize
        window.addEventListener('resize', resize)
      }
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  box-sizing: border-box;
  min-width: 100%;
  min-height: 160px;
}
</style>
