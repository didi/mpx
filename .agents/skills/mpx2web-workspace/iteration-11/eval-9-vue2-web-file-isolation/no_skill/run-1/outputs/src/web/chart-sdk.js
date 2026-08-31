function createEmptyChart () {
  return {
    update () {},
    resize () {},
    destroy () {}
  }
}

function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics, options) {
  await Promise.resolve()

  const chartOptions = options || {}
  if (chartOptions.signal && chartOptions.signal.aborted) return createEmptyChart()
  if (!element) throw new Error('A chart element is required.')

  const owner = {}
  const document = element.ownerDocument
  const root = document.createElement('div')
  let currentMetrics = []
  let destroyed = false

  root.className = 'analytics-chart__items'
  element.__analyticsChartOwner = owner
  element.textContent = ''
  element.appendChild(root)

  function update (nextMetrics) {
    if (destroyed) return

    currentMetrics = normalizeMetrics(nextMetrics)
    const maxValue = currentMetrics.reduce((max, item) => {
      const value = Number(item.value)
      return Number.isFinite(value) ? Math.max(max, Math.abs(value)) : max
    }, 0)

    root.textContent = ''
    currentMetrics.forEach((item, index) => {
      const metric = document.createElement('button')
      const bar = document.createElement('span')
      const label = document.createElement('span')
      const value = document.createElement('span')
      const numericValue = Number(item.value)
      const ratio = maxValue && Number.isFinite(numericValue) ? Math.abs(numericValue) / maxValue : 0

      metric.type = 'button'
      metric.className = 'analytics-chart__metric'
      metric.dataset.metricIndex = index
      metric.setAttribute('aria-label', `${item.label}: ${item.value}`)
      bar.className = 'analytics-chart__bar'
      bar.style.height = `${Math.max(2, Math.round(ratio * 100))}%`
      label.className = 'analytics-chart__label'
      label.textContent = item.label
      value.className = 'analytics-chart__value'
      value.textContent = item.value
      metric.appendChild(bar)
      metric.appendChild(label)
      metric.appendChild(value)
      root.appendChild(metric)
    })
  }

  function resize () {
    if (!destroyed) root.style.width = `${element.clientWidth}px`
  }

  function handleClick (event) {
    const metric = event.target.closest('.analytics-chart__metric')
    if (!metric || !root.contains(metric) || typeof chartOptions.onSelect !== 'function') return

    const selected = currentMetrics[Number(metric.dataset.metricIndex)]
    if (selected) chartOptions.onSelect(selected.key)
  }

  root.addEventListener('click', handleClick)
  update(metrics)
  resize()

  return {
    update,
    resize,
    destroy () {
      if (destroyed) return
      destroyed = true
      root.removeEventListener('click', handleClick)
      if (element.__analyticsChartOwner === owner) {
        element.textContent = ''
        delete element.__analyticsChartOwner
      }
    }
  }
}
