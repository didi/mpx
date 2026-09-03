const chartOwners = new WeakMap()

function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics, onSelect) {
  await Promise.resolve()

  if (!element) throw new Error('A chart container is required')

  const previousChart = chartOwners.get(element)
  if (previousChart) previousChart.destroy()

  let destroyed = false
  let metricKeys = new Map()

  const handleClick = (event) => {
    let target = event.target
    while (target && target !== element && !target.hasAttribute('data-metric-key')) {
      target = target.parentNode
    }
    if (!target || target === element || !target.hasAttribute('data-metric-key')) return

    const serializedKey = target.getAttribute('data-metric-key')
    if (metricKeys.has(serializedKey) && typeof onSelect === 'function') {
      onSelect(metricKeys.get(serializedKey))
    }
  }

  const chart = {
    update (nextMetrics) {
      if (destroyed || chartOwners.get(element) !== chart) return

      metricKeys = new Map()
      element.textContent = ''
      normalizeMetrics(nextMetrics).forEach((item, index) => {
        const key = item && item.key != null ? item.key : index
        const serializedKey = String(key)
        const metric = document.createElement('button')
        metric.type = 'button'
        metric.className = 'analytics-chart__metric'
        metric.id = serializedKey
        metric.setAttribute('data-metric-key', serializedKey)
        metric.textContent = `${item && item.label != null ? item.label : ''}:${item && item.value != null ? item.value : ''}`
        metricKeys.set(serializedKey, key)
        element.appendChild(metric)
      })
    },
    resize () {
      if (destroyed || chartOwners.get(element) !== chart) return
      element.getBoundingClientRect()
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      metricKeys.clear()

      if (chartOwners.get(element) === chart) {
        chartOwners.delete(element)
        element.textContent = ''
      }
    }
  }

  chartOwners.set(element, chart)
  element.addEventListener('click', handleClick)
  chart.update(metrics)
  return chart
}
