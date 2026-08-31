function renderChart (element, metrics) {
  const fragment = document.createDocumentFragment()
  metrics.forEach((item, index) => {
    const metric = document.createElement('button')
    metric.type = 'button'
    metric.className = 'analytics-chart__metric'
    metric.dataset.metricIndex = String(index)
    metric.textContent = `${item.label}:${item.value}`
    fragment.appendChild(metric)
  })
  element.textContent = ''
  element.appendChild(fragment)
}

export async function createChart (element, metrics, onSelect) {
  await Promise.resolve()
  let currentMetrics = metrics
  let destroyed = false

  const handleClick = (event) => {
    const target = event.target.closest('[data-metric-index]')
    if (!target || !element.contains(target)) return
    const metric = currentMetrics[Number(target.dataset.metricIndex)]
    if (metric && onSelect) onSelect(metric.key)
  }

  element.addEventListener('click', handleClick)
  renderChart(element, currentMetrics)

  return {
    update (nextMetrics) {
      if (destroyed) return
      currentMetrics = nextMetrics
      renderChart(element, currentMetrics)
    },
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      element.textContent = ''
    }
  }
}
