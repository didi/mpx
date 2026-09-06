function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function numericValue (value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.abs(number) : 0
}

function metricId (metric) {
  if (metric && metric.id != null) return String(metric.id)
  if (metric && metric.key != null) return String(metric.key)
  return ''
}

const chartOwnerKey = typeof Symbol === 'function'
  ? Symbol('analyticsChartOwner')
  : '__analyticsChartOwner__'

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element) throw new Error('A chart container is required')

  let destroyed = false
  let listenersAttached = false
  let currentMetrics = normalizeMetrics(metrics).slice()
  const owner = {}
  const ownsElement = () => element[chartOwnerKey] === owner

  const render = () => {
    if (destroyed || !ownsElement()) return

    const maximum = currentMetrics.reduce((result, metric) => {
      return Math.max(result, numericValue(metric && metric.value))
    }, 0)
    const fragment = document.createDocumentFragment()

    currentMetrics.forEach((metric, index) => {
      const button = document.createElement('button')
      const track = document.createElement('span')
      const bar = document.createElement('span')
      const label = document.createElement('span')
      const value = document.createElement('span')
      const height = maximum > 0
        ? Math.max(2, (numericValue(metric && metric.value) / maximum) * 100)
        : 2

      button.type = 'button'
      button.id = metricId(metric)
      button.className = 'analytics-chart__metric'
      button.setAttribute('data-metric-index', String(index))
      button.setAttribute('aria-label', `${metric && metric.label != null ? metric.label : ''}: ${metric && metric.value != null ? metric.value : ''}`)

      track.className = 'analytics-chart__bar-track'
      bar.className = 'analytics-chart__bar'
      bar.style.height = `${height}%`
      track.appendChild(bar)

      label.className = 'analytics-chart__label'
      label.textContent = metric && metric.label != null ? String(metric.label) : ''
      value.className = 'analytics-chart__value'
      value.textContent = metric && metric.value != null ? String(metric.value) : ''

      button.appendChild(track)
      button.appendChild(label)
      button.appendChild(value)
      fragment.appendChild(button)
    })

    element.replaceChildren(fragment)
  }

  const findMetricButton = (start) => {
    let node = start
    while (node && node !== element) {
      if (node.nodeType === 1 && node.hasAttribute('data-metric-index')) return node
      node = node.parentNode
    }
    return null
  }

  const handleClick = (event) => {
    if (destroyed) return
    const button = findMetricButton(event.target)
    if (!button) return

    const metric = currentMetrics[Number(button.getAttribute('data-metric-index'))]
    if (!metric || typeof options.onSelect !== 'function') return
    options.onSelect({ key: metric.key })
  }

  const handleWindowResize = () => {
    if (!destroyed) instance.resize()
  }

  const instance = {
    update (nextMetrics) {
      if (destroyed) return
      currentMetrics = normalizeMetrics(nextMetrics).slice()
      render()
    },
    resize () {
      if (destroyed) return
      // The DOM chart uses relative bar heights; a render re-measures its range.
      render()
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      if (listenersAttached) {
        listenersAttached = false
        element.removeEventListener('click', handleClick)
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleWindowResize)
        }
      }
      if (ownsElement()) {
        element.replaceChildren()
        delete element[chartOwnerKey]
      }
      currentMetrics = []
    }
  }

  if (typeof options.isCurrent === 'function' && !options.isCurrent()) {
    destroyed = true
    currentMetrics = []
    return instance
  }

  element[chartOwnerKey] = owner
  element.addEventListener('click', handleClick)
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResize)
  }
  listenersAttached = true
  render()

  return instance
}
