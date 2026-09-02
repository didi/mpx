function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function clearElement (element) {
  while (element.firstChild) element.removeChild(element.firstChild)
}

function metricId (metric) {
  if (metric && metric.id !== undefined && metric.id !== null) return String(metric.id)
  if (metric && metric.key !== undefined && metric.key !== null) return String(metric.key)
  return ''
}

function numericValue (metric) {
  const value = Number(metric && metric.value)
  return Number.isFinite(value) ? Math.abs(value) : 0
}

export async function createChart (element, metrics, options = {}) {
  if (!element || element.nodeType !== 1) {
    throw new TypeError('createChart requires a DOM element')
  }

  await Promise.resolve()

  let currentMetrics = normalizeMetrics(metrics)
  let destroyed = false

  const handleClick = (event) => {
    let target = event.target
    while (target && target !== element && !target.hasAttribute('data-metric-index')) {
      target = target.parentNode
    }
    if (!target || target === element) return

    const index = Number(target.getAttribute('data-metric-index'))
    const metric = currentMetrics[index]
    if (!metric || typeof options.onSelect !== 'function') return
    options.onSelect({ key: metric.key })
  }

  const render = () => {
    if (destroyed) return
    clearElement(element)
    element.setAttribute('role', 'list')
    element.setAttribute('aria-label', '数据指标')

    const maxValue = currentMetrics.reduce(
      (maximum, metric) => Math.max(maximum, numericValue(metric)),
      0
    )
    const fragment = document.createDocumentFragment()

    currentMetrics.forEach((metric, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'analytics-chart__metric'
      button.id = metricId(metric)
      button.setAttribute('role', 'listitem')
      button.setAttribute('data-metric-index', String(index))

      const label = document.createElement('span')
      label.className = 'analytics-chart__label'
      label.textContent = metric && metric.label !== undefined ? String(metric.label) : ''

      const value = document.createElement('span')
      value.className = 'analytics-chart__value'
      value.textContent = metric && metric.value !== undefined ? String(metric.value) : ''

      const track = document.createElement('span')
      track.className = 'analytics-chart__track'
      track.setAttribute('aria-hidden', 'true')

      const bar = document.createElement('span')
      bar.className = 'analytics-chart__bar'
      const percentage = maxValue > 0 ? numericValue(metric) / maxValue * 100 : 0
      bar.style.width = `${percentage}%`

      track.appendChild(bar)
      button.appendChild(label)
      button.appendChild(value)
      button.appendChild(track)
      fragment.appendChild(button)
    })

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
      element.classList.toggle('is-compact', element.clientWidth > 0 && element.clientWidth < 480)
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      element.classList.remove('is-compact')
      element.removeAttribute('role')
      element.removeAttribute('aria-label')
      clearElement(element)
      currentMetrics = []
    }
  }
}
