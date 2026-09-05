function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function metricNumber (metric) {
  const number = Number(metric && metric.value)
  return Number.isFinite(number) ? Math.abs(number) : 0
}

const chartOwners = new WeakMap()

export async function createChart (element, metrics, options = {}) {
  if (!element) throw new Error('A chart element is required')

  await Promise.resolve()
  const signal = options.signal
  if (signal && signal.aborted) return null

  let destroyed = false
  let currentMetrics = []
  const owner = {}

  const handleClick = (event) => {
    if (destroyed || chartOwners.get(element) !== owner) return
    let target = event.target
    while (target && target !== element && !target.hasAttribute('data-metric-index')) {
      target = target.parentNode
    }
    if (!target || target === element) return

    const index = Number(target.getAttribute('data-metric-index'))
    const metric = currentMetrics[index]
    if (metric && typeof options.onSelect === 'function') {
      options.onSelect({ key: metric.key })
    }
  }

  const render = (nextMetrics) => {
    if (destroyed || chartOwners.get(element) !== owner) return
    currentMetrics = normalizeMetrics(nextMetrics).slice()
    const documentRef = element.ownerDocument
    const fragment = documentRef.createDocumentFragment()
    const maximum = currentMetrics.reduce((max, metric) => Math.max(max, metricNumber(metric)), 0)

    currentMetrics.forEach((metric, index) => {
      const card = documentRef.createElement('button')
      const label = documentRef.createElement('span')
      const value = documentRef.createElement('span')
      const track = documentRef.createElement('span')
      const bar = documentRef.createElement('span')
      const metricId = metric && metric.id != null ? metric.id : metric && metric.key

      card.type = 'button'
      card.className = 'analytics-chart__metric'
      card.setAttribute('data-metric-index', String(index))
      if (metricId != null && String(metricId)) card.id = String(metricId)

      label.className = 'analytics-chart__label'
      label.textContent = metric && metric.label != null ? String(metric.label) : ''
      value.className = 'analytics-chart__value'
      value.textContent = metric && metric.value != null ? String(metric.value) : ''
      track.className = 'analytics-chart__bar-track'
      bar.className = 'analytics-chart__bar'
      bar.style.width = maximum > 0
        ? `${Math.max(2, metricNumber(metric) / maximum * 100)}%`
        : '0%'

      track.appendChild(bar)
      card.appendChild(label)
      card.appendChild(value)
      card.appendChild(track)
      fragment.appendChild(card)
    })

    element.textContent = ''
    element.appendChild(fragment)
  }

  const chart = {
    update (nextMetrics) {
      render(nextMetrics)
    },
    resize () {
      if (!destroyed && chartOwners.get(element) === owner) {
        element.style.setProperty('--analytics-chart-client-width', `${element.clientWidth}px`)
      }
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      if (signal) signal.removeEventListener('abort', chart.destroy)
      if (chartOwners.get(element) === owner) {
        chartOwners.delete(element)
        element.style.removeProperty('--analytics-chart-client-width')
        element.textContent = ''
      }
      currentMetrics = []
    }
  }

  chartOwners.set(element, owner)
  element.addEventListener('click', handleClick)
  if (signal) signal.addEventListener('abort', chart.destroy, { once: true })
  if (signal && signal.aborted) {
    chart.destroy()
    return null
  }

  render(metrics)
  return chart
}
