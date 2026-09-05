function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element) {
    throw new Error('A chart container is required')
  }

  const chartRoot = document.createElement('div')
  chartRoot.className = 'analytics-chart__content'
  element.appendChild(chartRoot)

  let destroyed = false
  let currentMetrics = []

  const render = (nextMetrics) => {
    if (destroyed) return

    currentMetrics = normalizeMetrics(nextMetrics)
    const fragment = document.createDocumentFragment()
    currentMetrics.forEach((item, index) => {
      const current = item || {}
      const metric = document.createElement('button')
      const key = current.key != null ? String(current.key) : ''
      metric.type = 'button'
      metric.className = 'analytics-chart__metric'
      metric.id = key
      metric.dataset.metricIndex = String(index)
      metric.textContent = `${current.label}:${current.value}`
      fragment.appendChild(metric)
    })
    chartRoot.replaceChildren(fragment)
  }

  const handleClick = (event) => {
    const metric = event.target.closest('[data-metric-index]')
    if (
      destroyed ||
      !metric ||
      !chartRoot.contains(metric) ||
      typeof options.onSelect !== 'function'
    ) return

    const selected = currentMetrics[Number(metric.dataset.metricIndex)]
    if (selected) options.onSelect(selected.key)
  }

  chartRoot.addEventListener('click', handleClick)
  render(metrics)

  return {
    update (nextMetrics) {
      render(nextMetrics)
    },
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      chartRoot.removeEventListener('click', handleClick)
      if (chartRoot.parentNode === element) {
        element.removeChild(chartRoot)
      }
    }
  }
}
