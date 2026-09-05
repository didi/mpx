function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element) throw new Error('A chart container is required')

  const chartRoot = document.createElement('div')
  chartRoot.className = 'analytics-chart__canvas'
  element.appendChild(chartRoot)

  let currentMetrics = []
  let destroyed = false

  const handleClick = (event) => {
    let target = event.target
    while (target && target !== chartRoot && !target.hasAttribute('data-metric-index')) {
      target = target.parentNode
    }
    if (!target || target === chartRoot) return

    const index = Number(target.getAttribute('data-metric-index'))
    const metric = currentMetrics[index]
    if (metric && typeof options.onSelect === 'function') {
      options.onSelect({ key: metric.key })
    }
  }

  const render = (nextMetrics) => {
    currentMetrics = normalizeMetrics(nextMetrics).slice()
    while (chartRoot.firstChild) chartRoot.removeChild(chartRoot.firstChild)

    currentMetrics.forEach((metric, index) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'analytics-chart__metric'
      item.setAttribute('data-metric-index', String(index))
      if (metric && metric.key != null) item.id = String(metric.key)

      const label = document.createElement('span')
      label.className = 'analytics-chart__label'
      label.textContent = metric && metric.label != null ? String(metric.label) : ''

      const value = document.createElement('span')
      value.className = 'analytics-chart__value'
      value.textContent = metric && metric.value != null ? String(metric.value) : ''

      item.appendChild(label)
      item.appendChild(value)
      chartRoot.appendChild(item)
    })
  }

  chartRoot.addEventListener('click', handleClick)
  render(metrics)

  return {
    update (nextMetrics) {
      if (!destroyed) render(nextMetrics)
    },
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      chartRoot.removeEventListener('click', handleClick)
      if (chartRoot.parentNode) chartRoot.parentNode.removeChild(chartRoot)
      currentMetrics = []
    }
  }
}
