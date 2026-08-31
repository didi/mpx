function render (element, metrics) {
  element.textContent = ''
  metrics.forEach((item) => {
    const metric = document.createElement('button')
    metric.type = 'button'
    metric.className = 'analytics-chart__metric'
    metric.dataset.metricKey = item.key
    metric.textContent = `${item.label}:${item.value}`
    element.appendChild(metric)
  })
}

export async function createChart (element, metrics) {
  await Promise.resolve()

  let destroyed = false
  render(element, metrics)

  return {
    update (nextMetrics) {
      if (!destroyed) render(element, nextMetrics)
    },
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      element.textContent = ''
    }
  }
}
