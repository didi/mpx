function normalizedMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function metricKey (metric) {
  return String(metric && metric.key !== undefined ? metric.key : '')
}

export async function createChart (element, metrics, options = {}) {
  if (!element) throw new Error('A chart container is required')

  await Promise.resolve()

  const ownerDocument = element.ownerDocument
  const chartRoot = ownerDocument.createElement('div')
  chartRoot.className = 'analytics-chart__content'
  element.appendChild(chartRoot)

  let destroyed = false
  let currentMetrics = normalizedMetrics(metrics)

  function render () {
    if (destroyed) return
    chartRoot.textContent = ''
    const fragment = ownerDocument.createDocumentFragment()
    currentMetrics.forEach((item) => {
      const metric = item || {}
      const key = metricKey(metric)
      const button = ownerDocument.createElement('button')
      button.type = 'button'
      button.className = 'analytics-chart__metric'
      button.dataset.metricKey = key
      button.id = String(metric.id !== undefined && metric.id !== '' ? metric.id : key)
      button.textContent = `${metric.label === undefined ? '' : metric.label}:${metric.value === undefined ? '' : metric.value}`
      fragment.appendChild(button)
    })
    chartRoot.appendChild(fragment)
  }

  function handleClick (event) {
    let target = event.target
    while (target && target !== chartRoot) {
      if (target.dataset && target.dataset.metricKey !== undefined) {
        const key = target.dataset.metricKey
        const metric = currentMetrics.find((item) => metricKey(item) === key)
        if (typeof options.onSelect === 'function') {
          options.onSelect({
            key: metric && metric.key !== undefined ? metric.key : key
          })
        }
        return
      }
      target = target.parentNode
    }
  }

  chartRoot.addEventListener('click', handleClick)
  render()

  return {
    update (nextMetrics) {
      if (destroyed) return
      currentMetrics = normalizedMetrics(nextMetrics)
      render()
    },
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      chartRoot.removeEventListener('click', handleClick)
      if (chartRoot.parentNode === element) element.removeChild(chartRoot)
      currentMetrics = []
    }
  }
}
