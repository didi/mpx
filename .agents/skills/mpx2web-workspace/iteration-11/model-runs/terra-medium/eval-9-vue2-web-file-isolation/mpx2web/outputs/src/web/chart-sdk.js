function renderChart (element, metrics) {
  if (!element) return
  element.textContent = metrics
    .map((item) => `${item.label}:${item.value}`)
    .join(' | ')
}

export async function createChart (element, metrics) {
  // Keep the asynchronous SDK boundary explicit: callers must handle unmounts
  // or newer requests while this promise is pending.
  await Promise.resolve()
  let destroyed = false
  let currentMetrics = Array.isArray(metrics) ? metrics : []
  // Each asynchronous request owns a distinct node. A late instance can then
  // remove only its own output instead of clearing a newer chart's output.
  const chartElement = element && document.createElement('div')
  if (element && chartElement) {
    chartElement.className = 'analytics-chart-sdk'
    element.appendChild(chartElement)
  }
  if (!destroyed) renderChart(chartElement, currentMetrics)

  return {
    update (nextMetrics) {
      if (destroyed) return
      currentMetrics = Array.isArray(nextMetrics) ? nextMetrics : []
      renderChart(chartElement, currentMetrics)
    },
    resize () {
      if (destroyed) return
      renderChart(chartElement, currentMetrics)
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      if (chartElement && chartElement.parentNode) {
        chartElement.parentNode.removeChild(chartElement)
      }
    }
  }
}
