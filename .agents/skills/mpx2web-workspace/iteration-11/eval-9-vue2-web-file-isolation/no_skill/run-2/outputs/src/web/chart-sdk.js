const activeCharts = new WeakMap()

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()
  if (options.signal && options.signal.aborted) return null

  const previousChart = activeCharts.get(element)
  if (previousChart) previousChart.destroy()

  let destroyed = false
  let currentMetrics = metrics

  const render = () => {
    const fragment = element.ownerDocument.createDocumentFragment()
    currentMetrics.forEach((item, index) => {
      const metric = element.ownerDocument.createElement('button')
      metric.type = 'button'
      metric.className = 'analytics-chart__metric'
      metric.setAttribute('data-metric-index', index)
      metric.textContent = `${item.label}:${item.value}`
      fragment.appendChild(metric)
    })
    element.textContent = ''
    element.appendChild(fragment)
  }

  const handleClick = (event) => {
    let target = event.target
    while (target && target !== element && !target.hasAttribute('data-metric-index')) {
      target = target.parentNode
    }
    if (!target || target === element) return

    const metric = currentMetrics[Number(target.getAttribute('data-metric-index'))]
    if (metric && options.onSelect) options.onSelect({ key: metric.key, metric })
  }

  const chart = {
    update (nextMetrics) {
      if (destroyed) return
      currentMetrics = nextMetrics
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
      if (options.signal) options.signal.removeEventListener('abort', chart.destroy)
      if (activeCharts.get(element) === chart) {
        activeCharts.delete(element)
        element.textContent = ''
      }
    }
  }

  element.addEventListener('click', handleClick)
  if (options.signal) options.signal.addEventListener('abort', chart.destroy, { once: true })
  activeCharts.set(element, chart)
  render()
  return chart
}
