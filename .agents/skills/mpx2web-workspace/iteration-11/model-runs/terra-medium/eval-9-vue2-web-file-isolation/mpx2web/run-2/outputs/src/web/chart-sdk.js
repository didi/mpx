export async function createChart (element, metrics, onSelect) {
  await Promise.resolve()

  let destroyed = false
  const keyByButton = new Map()
  const selectMetric = (event) => {
    const button = event.target.closest('[data-metric-key]')
    if (!destroyed && button && element.contains(button) && onSelect) onSelect(keyByButton.get(button))
  }

  const render = (nextMetrics) => {
    if (destroyed) return
    const items = Array.isArray(nextMetrics) ? nextMetrics : []
    element.textContent = ''
    keyByButton.clear()
    items.forEach((item) => {
      const bar = document.createElement('button')
      bar.type = 'button'
      bar.id = String(item.key)
      bar.dataset.metricKey = item.key
      bar.className = 'analytics-chart__metric'
      bar.textContent = `${item.label}: ${item.value}`
      keyByButton.set(bar, item.key)
      element.appendChild(bar)
    })
  }

  element.addEventListener('click', selectMetric)
  render(metrics)

  return {
    update: render,
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', selectMetric)
      keyByButton.clear()
      element.textContent = ''
    }
  }
}
