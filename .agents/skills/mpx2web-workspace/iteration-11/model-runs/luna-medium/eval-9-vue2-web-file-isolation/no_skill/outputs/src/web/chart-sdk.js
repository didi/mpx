function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function render (element, metrics) {
  element.textContent = ''
  normalizeMetrics(metrics).forEach(item => {
    const node = document.createElement('button')
    node.type = 'button'
    node.className = 'analytics-chart__metric'
    node.dataset.key = item.key
    node.textContent = `${item.label}: ${item.value}`
    element.appendChild(node)
  })
}

export async function createChart (element, metrics, onSelect) {
  await Promise.resolve()
  if (!element) throw new Error('A chart element is required')
  let currentMetrics = normalizeMetrics(metrics)
  const handleClick = event => {
    const node = event.target.closest('[data-key]')
    if (!node || !element.contains(node) || !onSelect) return
    const item = currentMetrics.find(metric => String(metric.key) === node.dataset.key)
    if (item) onSelect(item)
  }
  render(element, currentMetrics)
  element.addEventListener('click', handleClick)
  return {
    update (nextMetrics) {
      currentMetrics = normalizeMetrics(nextMetrics)
      render(element, currentMetrics)
    },
    resize () {},
    destroy () {
      element.removeEventListener('click', handleClick)
      element.textContent = ''
    }
  }
}
