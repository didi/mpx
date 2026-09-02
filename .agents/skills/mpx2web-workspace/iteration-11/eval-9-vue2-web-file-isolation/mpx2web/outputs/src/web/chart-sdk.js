function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics, options = {}) {
  if (!element) throw new Error('A chart container is required.')

  await Promise.resolve()

  let destroyed = false
  let currentMetrics = []

  function handleClick (event) {
    let target = event.target
    while (target && target !== element && !target.hasAttribute('data-analytics-metric-index')) {
      target = target.parentNode
    }
    if (!target || target === element) return

    const index = Number(target.getAttribute('data-analytics-metric-index'))
    const metric = currentMetrics[index]
    if (metric && typeof options.onSelect === 'function') {
      options.onSelect({ key: metric.key })
    }
  }

  function update (nextMetrics) {
    if (destroyed) return

    currentMetrics = normalizeMetrics(nextMetrics).slice()
    element.textContent = ''
    currentMetrics.forEach((metric, index) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'analytics-chart__metric'
      item.setAttribute('data-analytics-metric-index', String(index))

      const metricId = metric && metric.id != null ? metric.id : metric && metric.key
      if (metricId != null) item.id = String(metricId)

      const label = document.createElement('span')
      label.className = 'analytics-chart__label'
      label.textContent = metric && metric.label != null ? String(metric.label) : ''

      const value = document.createElement('strong')
      value.className = 'analytics-chart__value'
      value.textContent = metric && metric.value != null ? String(metric.value) : ''

      item.appendChild(label)
      item.appendChild(value)
      element.appendChild(item)
    })
  }

  element.addEventListener('click', handleClick)
  update(metrics)

  return {
    update,
    resize () {
      if (destroyed) return
      // The DOM-backed chart follows its container; this hook keeps the SDK contract explicit.
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      currentMetrics = []
      element.textContent = ''
    }
  }
}
