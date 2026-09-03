function normaliseMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function renderMetrics (element, metrics) {
  const fragment = document.createDocumentFragment()

  normaliseMetrics(metrics).forEach((metric) => {
    const item = document.createElement('button')
    item.type = 'button'
    item.id = String(metric.key)
    item.className = 'analytics-chart__metric'
    item.setAttribute('data-metric-key', String(metric.key))
    item.__analyticsMetricKey = metric.key

    const label = document.createElement('span')
    label.className = 'analytics-chart__label'
    label.textContent = metric.label == null ? '' : String(metric.label)

    const value = document.createElement('strong')
    value.className = 'analytics-chart__value'
    value.textContent = metric.value == null ? '' : String(metric.value)

    item.appendChild(label)
    item.appendChild(value)
    fragment.appendChild(item)
  })

  element.replaceChildren(fragment)
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element || (options.isCancelled && options.isCancelled())) {
    return null
  }

  let destroyed = false
  const handleClick = (event) => {
    const item = event.target.closest('[data-metric-key]')
    if (!item || !element.contains(item) || destroyed) return

    if (options.onSelect) {
      options.onSelect(item.__analyticsMetricKey)
    }
  }

  element.addEventListener('click', handleClick)
  renderMetrics(element, metrics)

  return {
    update (nextMetrics) {
      if (!destroyed) {
        renderMetrics(element, nextMetrics)
      }
    },
    resize () {
      if (!destroyed) {
        element.style.setProperty('--analytics-chart-width', `${element.clientWidth}px`)
      }
    },
    destroy () {
      if (destroyed) return

      destroyed = true
      element.removeEventListener('click', handleClick)
      element.replaceChildren()
      element.style.removeProperty('--analytics-chart-width')
    }
  }
}
