const chartsByElement = new WeakMap()
const chartRequestVersions = new WeakMap()

function createDisposedChart () {
  return {
    update () {},
    resize () {},
    destroy () {}
  }
}

function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function clearElement (element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

function metricKey (metric, index) {
  return metric && metric.key != null ? String(metric.key) : String(index)
}

function metricId (metric, key) {
  const candidate = metric && metric.id != null ? String(metric.id) : key
  return candidate && !/^\d/.test(candidate) ? candidate : `metric-${candidate}`
}

export async function createChart (element, metrics, options = {}) {
  if (!element || typeof element.addEventListener !== 'function') {
    throw new TypeError('createChart requires a DOM element')
  }

  const requestVersion = (chartRequestVersions.get(element) || 0) + 1
  chartRequestVersions.set(element, requestVersion)
  await Promise.resolve()
  if (chartRequestVersions.get(element) !== requestVersion) {
    return createDisposedChart()
  }

  const previousChart = chartsByElement.get(element)
  if (previousChart) previousChart.destroy()

  let destroyed = false
  let currentMetrics = normalizeMetrics(metrics)

  const handleClick = (event) => {
    if (destroyed || typeof options.onSelect !== 'function') return
    const button = event.target && event.target.closest
      ? event.target.closest('[data-analytics-metric-index]')
      : null
    if (!button || !element.contains(button)) return

    const index = Number(button.getAttribute('data-analytics-metric-index'))
    if (!Number.isInteger(index) || index < 0 || index >= currentMetrics.length) return
    const metric = currentMetrics[index]
    options.onSelect(metric && metric.key != null ? metric.key : index)
  }

  const render = () => {
    if (destroyed) return
    const ownerDocument = element.ownerDocument
    const values = currentMetrics.map((metric) => Math.abs(Number(metric && metric.value)))
    const maxValue = Math.max(1, ...values.filter(Number.isFinite))
    const fragment = ownerDocument.createDocumentFragment()

    currentMetrics.forEach((metric, index) => {
      const key = metricKey(metric, index)
      const row = ownerDocument.createElement('div')
      const button = ownerDocument.createElement('button')
      const label = ownerDocument.createElement('span')
      const value = ownerDocument.createElement('span')
      const bar = ownerDocument.createElement('span')
      const barValue = ownerDocument.createElement('span')
      const numericValue = Math.abs(Number(metric && metric.value))
      const width = Number.isFinite(numericValue) ? Math.min(100, numericValue / maxValue * 100) : 0

      row.id = metricId(metric, key)
      row.className = 'analytics-chart__metric'
      row.setAttribute('role', 'listitem')

      button.type = 'button'
      button.className = 'analytics-chart__button'
      button.setAttribute('data-analytics-metric-index', String(index))

      label.className = 'analytics-chart__label'
      label.textContent = metric && metric.label != null ? String(metric.label) : ''
      value.className = 'analytics-chart__value'
      value.textContent = metric && metric.value != null ? String(metric.value) : ''
      bar.className = 'analytics-chart__bar'
      bar.setAttribute('aria-hidden', 'true')
      barValue.className = 'analytics-chart__bar-value'
      barValue.style.width = `${width}%`

      bar.appendChild(barValue)
      button.appendChild(label)
      button.appendChild(value)
      button.appendChild(bar)
      row.appendChild(button)
      fragment.appendChild(row)
    })

    clearElement(element)
    element.appendChild(fragment)
  }

  const chart = {
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
      element.style.removeProperty('--analytics-chart-width')
      clearElement(element)
      if (chartsByElement.get(element) === chart) {
        chartsByElement.delete(element)
      }
    }
  }

  element.addEventListener('click', handleClick)
  chartsByElement.set(element, chart)
  render()
  return chart
}
