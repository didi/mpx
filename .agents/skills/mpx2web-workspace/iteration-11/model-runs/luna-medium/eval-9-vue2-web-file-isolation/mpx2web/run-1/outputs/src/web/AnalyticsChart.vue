<template>
  <div class="analytics-chart">
    <div ref="plot" class="analytics-chart__plot"></div>
    <button
      v-for="item in metrics"
      :id="metricId(item)"
      :key="item.key"
      type="button"
      class="analytics-chart__metric"
      @click="selectMetric(item.key)"
    >
      <span>{{ item.label }}</span>
      <span>{{ item.value }}</span>
    </button>
  </div>
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
      chartGeneration: 0,
      destroyed: false
    }
  },
  mounted () {
    this.initChart()
  },
  beforeDestroy () {
    this.destroyed = true
    this.chartGeneration += 1
    this.destroyChart()
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chart && this.chart.update) this.chart.update(metrics)
      }
    }
  },
  methods: {
    metricId (item) {
      return `metric-${String(item.key).replace(/[^a-zA-Z0-9_-]/g, '-')}`
    },
    selectMetric (key) {
      this.$emit('select', { key })
    },
    async initChart () {
      const generation = ++this.chartGeneration
      const element = this.$refs.plot
      const instance = await createChart(element, this.metrics)
      if (this.destroyed || generation !== this.chartGeneration || !element || element.isConnected === false) {
        if (instance && instance.destroy) instance.destroy()
        return
      }
      this.chart = instance
    },
    destroyChart () {
      if (this.chart && this.chart.destroy) this.chart.destroy()
      this.chart = null
    },
    resize () {
      if (this.chart && this.chart.resize) this.chart.resize()
    }
  }
}
</script>

<style scoped>
.analytics-chart { display: flex; flex-wrap: wrap; gap: 8px; }
.analytics-chart__metric { cursor: pointer; }
</style>
