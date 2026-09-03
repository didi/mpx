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
      chartGeneration: 0,
      resizeObserver: null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart) {
          this.chart.update(metrics)
        }
      }
    }
  },
  mounted () {
    this.observeSize()
    this.createChart()
  },
  beforeDestroy () {
    this.dispose()
  },
  methods: {
    async createChart () {
      const generation = ++this.chartGeneration
      const element = this.$refs.chart
      const chart = await createChart(element, this.metrics, {
        isCancelled: () => generation !== this.chartGeneration,
        onSelect: (key) => this.$emit('select', { key })
      })

      if (!chart) return

      if (generation !== this.chartGeneration || this._isBeingDestroyed || this._isDestroyed) {
        chart.destroy()
        return
      }

      if (this.chart) {
        this.chart.destroy()
      }
      this.chart = chart
      this.chart.update(this.metrics)
      this.chart.resize()
    },
    observeSize () {
      if (typeof ResizeObserver === 'undefined') return

      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) {
          this.chart.resize()
        }
      })
      this.resizeObserver.observe(this.$refs.chart)
    },
    dispose () {
      ++this.chartGeneration

      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }

      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  box-sizing: border-box;
  display: flex;
  min-width: max-content;
  min-height: 100%;
  gap: 12px;
  padding: 12px;
}
</style>
