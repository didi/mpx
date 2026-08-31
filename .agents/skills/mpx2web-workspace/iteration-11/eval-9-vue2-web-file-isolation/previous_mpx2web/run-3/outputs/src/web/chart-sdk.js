export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  let currentMetrics = metrics
  let destroyed = false

  const handleClick = (event) => {
    const target = event.target.closest && event.target.closest('[data-metric-index]')
    if (!target || !element.contains(target)) return
    const metric = currentMetrics[Number(target.dataset.metricIndex)]
    if (metric && options.onSelect) options.onSelect(metric.key)
  }

  const render = (nextMetrics) => {
    if (destroyed) return
    currentMetrics = nextMetrics
    element.textContent = ''
    nextMetrics.forEach((item, index) => {
      const metric = document.createElement('button')
      metric.type = 'button'
      metric.dataset.metricIndex = index
      metric.textContent = `${item.label}:${item.value}`
      element.appendChild(metric)
    })
  }

  element.addEventListener('click', handleClick)
  render(metrics)

  return {
    update (nextMetrics) {
      render(nextMetrics)
    },
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      element.textContent = ''
    }
  }
}
