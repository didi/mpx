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
      createToken: 0,
      disposed: false,
      resizeObserver: null,
      removeResizeFallback: null,
      latestMetrics: this.metrics
    }
  },
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        this.latestMetrics = metrics || []
        if (this.chart) {
          this.chart.update(this.latestMetrics)
        }
      }
    }
  },
  mounted () {
    this.observeSize()
    this.mountChart()
  },
  beforeDestroy () {
    this.disposed = true
    this.createToken += 1

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.removeResizeFallback) {
      this.removeResizeFallback()
      this.removeResizeFallback = null
    }
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  methods: {
    async mountChart () {
      const element = this.$refs.chart
      const token = ++this.createToken
      const cancellation = {
        isCancelled: () => this.disposed || token !== this.createToken
      }

      let chart
      try {
        chart = await createChart(element, this.latestMetrics, {
          isCancelled: cancellation.isCancelled,
          onSelect: this.handleSelect
        })
      } catch (error) {
        if (!cancellation.isCancelled()) {
          this.$emit('error', error)
        }
        return
      }

      if (!chart) return
      if (cancellation.isCancelled() || this.$refs.chart !== element) {
        chart.destroy()
        return
      }

      if (this.chart) this.chart.destroy()
      this.chart = chart
      this.chart.update(this.latestMetrics)
      this.chart.resize()
    },
    handleSelect (detail) {
      if (!this.disposed) this.$emit('select', detail)
    },
    resizeChart () {
      if (!this.disposed && this.chart) this.chart.resize()
    },
    observeSize () {
      const element = this.$refs.chart
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.resizeChart)
        this.resizeObserver.observe(element)
        return
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.resizeChart)
        this.removeResizeFallback = () => {
          window.removeEventListener('resize', this.resizeChart)
        }
      }
    }
  }
}
</script>

<style scoped>
.analytics-chart {
  box-sizing: border-box;
  min-width: 100%;
  min-height: 180px;
}

.analytics-chart ::v-deep .analytics-chart__items {
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  min-width: max-content;
  min-height: 180px;
  padding: 16px;
}

.analytics-chart ::v-deep .analytics-chart__metric {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 136px;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 96px;
  padding: 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  color: #101828;
  background: #fff;
  cursor: pointer;
}

.analytics-chart ::v-deep .analytics-chart__metric:hover,
.analytics-chart ::v-deep .analytics-chart__metric:focus-visible {
  border-color: #6172f3;
  outline: none;
  box-shadow: 0 0 0 3px rgb(97 114 243 / 18%);
}

.analytics-chart ::v-deep .analytics-chart__label {
  color: #667085;
  font-size: 13px;
}

.analytics-chart ::v-deep .analytics-chart__value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
}
</style>
