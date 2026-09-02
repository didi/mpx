function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function metricId (metric) {
  if (metric && metric.id != null) return String(metric.id)
  if (metric && metric.key != null) return String(metric.key)
  return ''
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element) {
    throw new Error('A chart container element is required')
  }

  let destroyed = false
  let currentMetrics = normalizeMetrics(metrics)

  const handleClick = (event) => {
    if (destroyed) return
    let target = event.target
    while (target && target !== element && !target.hasAttribute('data-metric-index')) {
      target = target.parentNode
    }
    if (!target || target === element || !target.hasAttribute('data-metric-index')) return

    const index = Number(target.getAttribute('data-metric-index'))
    const metric = currentMetrics[index]
    if (typeof options.onSelect === 'function') {
      options.onSelect(metric ? metric.key : undefined)
    }
  }

  const render = () => {
    if (destroyed) return
    const ownerDocument = element.ownerDocument
    const fragment = ownerDocument.createDocumentFragment()
    currentMetrics.forEach((metric, index) => {
      const item = ownerDocument.createElement('button')
      const id = metricId(metric)
      item.type = 'button'
      item.className = 'analytics-chart__metric'
      item.setAttribute('data-metric-index', String(index))
      if (id) item.id = id

      const label = ownerDocument.createElement('span')
      label.className = 'analytics-chart__label'
      label.textContent = metric && metric.label != null ? String(metric.label) : ''

      const value = ownerDocument.createElement('strong')
      value.className = 'analytics-chart__value'
      value.textContent = metric && metric.value != null ? String(metric.value) : ''

      item.appendChild(label)
      item.appendChild(value)
      fragment.appendChild(item)
    })

    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
    element.appendChild(fragment)
  }

  element.addEventListener('click', handleClick)
  render()

  return {
    update (nextMetrics) {
      if (destroyed) return
      currentMetrics = normalizeMetrics(nextMetrics)
      render()
    },
    resize () {
      if (destroyed) return
      element.style.setProperty('--analytics-chart-width', `${element.clientWidth}px`)
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      while (element.firstChild) {
        element.removeChild(element.firstChild)
      }
      element.style.removeProperty('--analytics-chart-width')
    }
  }
}
