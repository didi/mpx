function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()
  if (!element) throw new Error('A chart container is required')
  if (typeof options.isCurrent === 'function' && !options.isCurrent()) {
    return {
      update () {},
      resize () {},
      destroy () {}
    }
  }

  const chartRoot = document.createElement('div')
  chartRoot.className = 'analytics-chart__content'
  let currentMetrics = []
  let destroyed = false

  const render = (nextMetrics) => {
    if (destroyed) return
    currentMetrics = normalizeMetrics(nextMetrics)
    chartRoot.textContent = ''
    currentMetrics.forEach((item, index) => {
      const metric = document.createElement('button')
      metric.type = 'button'
      metric.className = 'analytics-chart__metric'
      metric.setAttribute('data-metric-index', String(index))
      if (item && item.key !== undefined && item.key !== null) {
        metric.id = String(item.key)
      }
      const label = item && item.label !== undefined ? item.label : ''
      const value = item && item.value !== undefined ? item.value : ''
      metric.textContent = `${label}:${value}`
      chartRoot.appendChild(metric)
    })

    if (chartRoot.parentNode !== element) {
      element.textContent = ''
      element.appendChild(chartRoot)
    }
  }

  const handleClick = (event) => {
    if (destroyed || typeof options.onSelect !== 'function') return
    let target = event.target
    while (target && target !== element && !target.hasAttribute('data-metric-index')) {
      target = target.parentNode
    }
    if (!target || target === element || !chartRoot.contains(target)) return
    const index = Number(target.getAttribute('data-metric-index'))
    const metric = currentMetrics[index]
    if (!metric) return
    options.onSelect({ key: metric.key })
  }

  element.addEventListener('click', handleClick)
  render(metrics)

  return {
    update (nextMetrics) {
      render(nextMetrics)
    },
    resize () {
      if (!destroyed && chartRoot.parentNode !== element) render(currentMetrics)
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      if (chartRoot.parentNode === element) element.removeChild(chartRoot)
      currentMetrics = []
    }
  }
}
