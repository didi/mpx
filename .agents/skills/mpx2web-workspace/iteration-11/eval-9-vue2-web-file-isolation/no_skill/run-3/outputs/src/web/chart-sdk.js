function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function metricKey (metric, index) {
  if (metric && metric.key !== undefined && metric.key !== null) {
    return String(metric.key)
  }
  return String(index)
}

function metricId (metric, index) {
  if (metric && metric.id !== undefined && metric.id !== null) {
    return String(metric.id)
  }
  return metricKey(metric, index)
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element) {
    throw new Error('A chart container is required')
  }

  const root = document.createElement('div')
  root.className = 'analytics-chart-sdk'
  root.setAttribute('role', 'list')
  element.appendChild(root)

  let destroyed = false
  let currentMetrics = []

  function render (nextMetrics) {
    if (destroyed) return

    currentMetrics = normalizeMetrics(nextMetrics).slice()
    while (root.firstChild) {
      root.removeChild(root.firstChild)
    }

    currentMetrics.forEach((metric, index) => {
      const key = metricKey(metric, index)
      const button = document.createElement('button')
      const label = document.createElement('span')
      const value = document.createElement('span')

      button.type = 'button'
      button.id = metricId(metric, index)
      button.className = 'analytics-chart-sdk__metric'
      button.setAttribute('data-metric-key', key)
      button.setAttribute('role', 'listitem')

      label.className = 'analytics-chart-sdk__label'
      label.textContent = metric && metric.label !== undefined ? String(metric.label) : ''
      value.className = 'analytics-chart-sdk__value'
      value.textContent = metric && metric.value !== undefined ? String(metric.value) : ''

      button.appendChild(label)
      button.appendChild(value)
      root.appendChild(button)
    })
  }

  function handleClick (event) {
    if (destroyed || typeof options.onSelect !== 'function') return

    let target = event.target
    while (target && target !== root && !target.hasAttribute('data-metric-key')) {
      target = target.parentNode
    }
    if (!target || target === root) return

    const key = target.getAttribute('data-metric-key')
    const index = currentMetrics.findIndex((metric, metricIndex) => {
      return metricKey(metric, metricIndex) === key
    })
    const selectedMetric = index >= 0 ? currentMetrics[index] : undefined
    const selectedKey = selectedMetric &&
      selectedMetric.key !== undefined &&
      selectedMetric.key !== null
      ? selectedMetric.key
      : key
    options.onSelect({
      key: selectedKey,
      metric: selectedMetric
    })
  }

  root.addEventListener('click', handleClick)
  render(metrics)

  return {
    update (nextMetrics) {
      render(nextMetrics)
    },
    resize () {
      if (destroyed) return
      root.classList.toggle('analytics-chart-sdk--compact', element.clientWidth < 560)
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      root.removeEventListener('click', handleClick)
      if (root.parentNode === element) {
        element.removeChild(root)
      }
      currentMetrics = []
    }
  }
}
