function render (element, metrics, onSelect) {
  element.textContent = ''
  const fragment = document.createDocumentFragment()
  metrics.forEach((item, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'analytics-chart__bar'
    button.id = item.id || item.key || `metric-${index}`
    button.dataset.index = String(index)
    button.textContent = `${item.label}: ${item.value}`
    button.addEventListener('click', onSelect)
    fragment.appendChild(button)
  })
  element.appendChild(fragment)
}

export function createChart (element, metrics = [], options = {}) {
  const lifecycle = options.lifecycle || { cancelled: false }
  const onSelect = (event) => {
    const index = Number(event.currentTarget.dataset.index)
    const item = metrics[index]
    if (item && options.onSelect) options.onSelect(item.key)
  }
  return Promise.resolve().then(() => {
    if (lifecycle.cancelled || !element) return null
    render(element, metrics, onSelect)
    return {
      update (nextMetrics = []) {
        metrics = nextMetrics
        if (!lifecycle.cancelled) render(element, metrics, onSelect)
      },
      resize () {},
      destroy () {
        lifecycle.cancelled = true
        element.textContent = ''
      }
    }
  })
}
