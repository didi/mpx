function metricId (metric, index) {
  return String(metric.id || metric.key || `metric-${index}`)
}

function drawChart (element, metrics, onSelect) {
  if (!element) return
  element.textContent = ''

  const list = document.createElement('div')
  list.className = 'analytics-chart__metrics'
  metrics.forEach((metric, index) => {
    const item = document.createElement('button')
    item.type = 'button'
    item.id = metricId(metric, index)
    item.className = 'analytics-chart__metric'
    item.setAttribute('role', 'listitem')
    item.textContent = `${metric.label}:${metric.value}`
    item.addEventListener('click', () => onSelect(metric))
    list.appendChild(item)
  })
  element.appendChild(list)
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()
  if (!element || (options.isCurrent && !options.isCurrent())) return null

  const currentMetrics = Array.isArray(metrics) ? metrics : []
  const onSelect = typeof options.onSelect === 'function' ? options.onSelect : () => {}
  drawChart(element, currentMetrics, onSelect)

  return {
    update (nextMetrics) {
      drawChart(element, Array.isArray(nextMetrics) ? nextMetrics : [], onSelect)
    },
    resize () {},
    destroy () {
      if (element) element.textContent = ''
    }
  }
}
