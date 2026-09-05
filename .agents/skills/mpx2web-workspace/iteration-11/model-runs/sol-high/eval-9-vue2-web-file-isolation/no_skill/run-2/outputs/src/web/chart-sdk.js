const activeCharts = new WeakMap()

function normalizedMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function metricId (metric, index) {
  if (metric && metric.id !== undefined && metric.id !== null) {
    return String(metric.id)
  }
  if (metric && metric.key !== undefined && metric.key !== null) {
    return String(metric.key)
  }
  return `metric-${index}`
}

function metricNumber (metric) {
  const value = Number(metric && metric.value)
  return Number.isFinite(value) ? Math.abs(value) : 0
}

export async function createChart (element, metrics, options = {}) {
  if (!element || typeof element.addEventListener !== 'function') {
    throw new TypeError('createChart requires a DOM element')
  }

  await Promise.resolve()

  if (typeof options.isCancelled === 'function' && options.isCancelled()) {
    return null
  }

  const previousChart = activeCharts.get(element)
  if (previousChart) {
    previousChart.destroy()
  }

  let destroyed = false
  let currentMetrics = []

  const render = (nextMetrics) => {
    if (destroyed) return
    currentMetrics = normalizedMetrics(nextMetrics).slice()
    const maxValue = currentMetrics.reduce((max, metric) => Math.max(max, metricNumber(metric)), 0)
    const fragment = document.createDocumentFragment()

    currentMetrics.forEach((metric, index) => {
      const button = document.createElement('button')
      const label = document.createElement('span')
      const value = document.createElement('span')
      const bar = document.createElement('span')

      button.type = 'button'
      button.id = metricId(metric, index)
      button.className = 'analytics-chart__metric'
      button.dataset.chartMetricIndex = String(index)
      button.setAttribute('role', 'listitem')

      label.className = 'analytics-chart__label'
      label.textContent = metric && metric.label !== undefined ? String(metric.label) : ''
      value.className = 'analytics-chart__value'
      value.textContent = metric && metric.value !== undefined ? String(metric.value) : ''
      bar.className = 'analytics-chart__bar'
      bar.style.width = `${maxValue > 0 ? (metricNumber(metric) / maxValue) * 100 : 0}%`

      button.appendChild(label)
      button.appendChild(value)
      button.appendChild(bar)
      fragment.appendChild(button)
    })

    element.replaceChildren(fragment)
  }

  const handleClick = (event) => {
    let target = event.target
    while (target && target !== element && !target.dataset.chartMetricIndex) {
      target = target.parentNode
    }
    if (!target || target === element) return

    const index = Number(target.dataset.chartMetricIndex)
    const metric = currentMetrics[index]
    if (metric && typeof options.onSelect === 'function') {
      options.onSelect(metric)
    }
  }

  const chart = {
    update (nextMetrics) {
      render(nextMetrics)
    },
    resize () {
      if (destroyed) return
      element.style.setProperty('--analytics-chart-width', `${element.clientWidth}px`)
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      if (activeCharts.get(element) === chart) {
        activeCharts.delete(element)
        element.replaceChildren()
        element.style.removeProperty('--analytics-chart-width')
      }
      currentMetrics = []
    }
  }

  activeCharts.set(element, chart)
  element.addEventListener('click', handleClick)
  render(metrics)
  return chart
}
