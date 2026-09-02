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
  watch: {
    metrics: {
      deep: true,
      handler (metrics) {
        if (this.chartInstance) this.chartInstance.update(metrics)
      }
    }
  },
  mounted () {
    this.chartGeneration = 0
    this.chartDetached = false
    this.chartInstance = null
    this.resizeObserver = null
    this.observeChartSize()
    this.mountChart()
  },
  beforeDestroy () {
    this.chartDetached = true
    this.chartGeneration += 1

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.chartInstance) {
      this.chartInstance.destroy()
      this.chartInstance = null
    }
  },
  methods: {
    async mountChart () {
      const element = this.$refs.chart
      const generation = ++this.chartGeneration

      try {
        const instance = await createChart(element, this.metrics, {
          onSelect: (detail) => this.$emit('select', detail)
        })

        if (this.chartDetached || generation !== this.chartGeneration) {
          instance.destroy()
          return
        }

        this.chartInstance = instance
        this.chartInstance.update(this.metrics)
        this.chartInstance.resize()
      } catch (error) {
        if (!this.chartDetached && generation === this.chartGeneration) {
          this.$emit('chart-error', error)
        }
      }
    },
    observeChartSize () {
      const element = this.$refs.chart
      const ownerWindow = element && element.ownerDocument && element.ownerDocument.defaultView
      const Observer = ownerWindow && ownerWindow.ResizeObserver

      if (!Observer || !element) return

      this.resizeObserver = new Observer(() => {
        if (this.chartInstance) this.chartInstance.resize()
      })
      this.resizeObserver.observe(element)
    }
  }
}
</script>

<style>
.analytics-chart {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-width: 100%;
  min-height: 180px;
  box-sizing: border-box;
  padding: 16px;
}

.analytics-chart__metric {
  display: flex;
  flex: 0 0 132px;
  min-height: 148px;
  box-sizing: border-box;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
}

.analytics-chart__metric:focus-visible {
  outline: 2px solid #3478f6;
  outline-offset: 2px;
}

.analytics-chart__bar {
  width: 100%;
  height: var(--analytics-bar-height, 2px);
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: #3478f6;
}

.analytics-chart__label,
.analytics-chart__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analytics-chart__label {
  font-size: 13px;
  color: #64748b;
}

.analytics-chart__value {
  font-size: 18px;
  font-weight: 600;
}
</style>
