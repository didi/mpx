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
      chartInstance: null,
      createGeneration: 0,
      isDestroyed: false,
      resizeObserver: null,
      windowResizeHandler: null
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chartInstance) {
          this.chartInstance.update(metrics || [])
        }
      }
    }
  },
  mounted () {
    this.isDestroyed = false
    this.observeSize()
    this.initializeChart()
  },
  beforeDestroy () {
    this.isDestroyed = true
    this.createGeneration += 1
    this.stopObservingSize()
    if (this.chartInstance) {
      this.chartInstance.destroy()
      this.chartInstance = null
    }
  },
  methods: {
    async initializeChart () {
      const generation = ++this.createGeneration
      const element = this.$refs.chart
      const instance = await createChart(element, this.metrics || [], {
        onSelect: (key) => {
          if (!this.isDestroyed && generation === this.createGeneration) {
            this.$emit('select', { key })
          }
        }
      })

      if (
        this.isDestroyed ||
        generation !== this.createGeneration ||
        element !== this.$refs.chart
      ) {
        instance.destroy()
        return
      }

      if (this.chartInstance) {
        this.chartInstance.destroy()
      }
      this.chartInstance = instance
      this.chartInstance.update(this.metrics || [])
      this.chartInstance.resize()
    },
    observeSize () {
      const element = this.$refs.chart
      if (!element) return

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          this.resizeChart()
        })
        this.resizeObserver.observe(element)
      } else if (typeof window !== 'undefined') {
        this.windowResizeHandler = () => this.resizeChart()
        window.addEventListener('resize', this.windowResizeHandler)
      }
    },
    stopObservingSize () {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      if (this.windowResizeHandler && typeof window !== 'undefined') {
        window.removeEventListener('resize', this.windowResizeHandler)
        this.windowResizeHandler = null
      }
    },
    resizeChart () {
      if (!this.isDestroyed && this.chartInstance) {
        this.chartInstance.resize()
      }
    }
  }
}
</script>

<style>
.analytics-chart {
  display: inline-flex;
  min-width: 100%;
  gap: 12px;
  box-sizing: border-box;
  padding: 8px;
}

.analytics-chart__metric {
  display: inline-flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
  padding: 12px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #fff;
  color: #1f2329;
  cursor: pointer;
}

.analytics-chart__label {
  color: #646a73;
}

.analytics-chart__value {
  font-size: 20px;
}
</style>
