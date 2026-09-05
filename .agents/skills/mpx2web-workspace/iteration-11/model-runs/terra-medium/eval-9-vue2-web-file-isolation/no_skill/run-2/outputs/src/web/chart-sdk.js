function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function render (element, metrics) {
  element.textContent = normalizeMetrics(metrics)
    .map((item) => `${item.label}:${item.value}`)
    .join(' | ')
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()
  if (!element || (options.isCurrent && !options.isCurrent())) return null

  let destroyed = false
  render(element, metrics)

  return {
    update (nextMetrics) {
      if (!destroyed) render(element, nextMetrics)
    },
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      element.textContent = ''
    }
  }
}
