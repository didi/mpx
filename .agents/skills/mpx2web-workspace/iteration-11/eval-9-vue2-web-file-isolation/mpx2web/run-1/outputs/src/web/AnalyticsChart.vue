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
      resizeObserver: null,
      chartGeneration: 0,
      chartDisposed: false
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chartInstance) this.chartInstance.update(metrics || [])
      }
    }
  },
  mounted () {
    this.chartDisposed = false
    this.initChart()
  },
  beforeDestroy () {
    this.chartDisposed = true
    this.chartGeneration += 1
    this.releaseChartResources()
  },
  methods: {
    isCurrentChart (generation, element) {
      return !this.chartDisposed &&
        !this._isBeingDestroyed &&
        !this._isDestroyed &&
        this.chartGeneration === generation &&
        this.$refs.chart === element
    },
    async initChart () {
      const generation = this.chartGeneration + 1
      const element = this.$refs.chart
      this.chartGeneration = generation
      this.releaseChartResources()

      let instance
      try {
        instance = await createChart(element, this.metrics || [], {
          onSelect: (detail) => {
            if (!this.isCurrentChart(generation, element) ||
              this.chartInstance !== instance) return
            this.$emit('select', detail)
          }
        })
      } catch (error) {
        if (this.isCurrentChart(generation, element)) {
          this.$emit('chart-error', error)
        }
        return
      }

      if (!this.isCurrentChart(generation, element)) {
        if (instance && instance.destroy) instance.destroy()
        return
      }

      this.chartInstance = instance
      instance.update(this.metrics || [])
      this.bindResizeObserver(generation, element, instance)
    },
    bindResizeObserver (generation, element, instance) {
      const browserWindow = element && element.ownerDocument &&
        element.ownerDocument.defaultView
      const ResizeObserverClass = browserWindow && browserWindow.ResizeObserver
      if (!ResizeObserverClass) return

      const observer = new ResizeObserverClass(() => {
        if (!this.isCurrentChart(generation, element) ||
          this.chartInstance !== instance ||
          this.resizeObserver !== observer) return
        instance.resize()
      })
      this.resizeObserver = observer
      observer.observe(element)
    },
    releaseChartResources () {
      const observer = this.resizeObserver
      const instance = this.chartInstance
      this.resizeObserver = null
      this.chartInstance = null
      if (observer) observer.disconnect()
      if (instance && instance.destroy) instance.destroy()
    }
  }
}
</script>
