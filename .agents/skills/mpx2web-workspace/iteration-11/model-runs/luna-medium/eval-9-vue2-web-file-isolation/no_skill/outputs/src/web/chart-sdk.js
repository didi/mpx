function render (element, metrics) {
  if (!element) return
  element.textContent = (Array.isArray(metrics) ? metrics : []).map(item => `${item.label}:${item.value}`).join(' | ')
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()
  if (options.isCurrent && !options.isCurrent()) return null
  let destroyed = false
  render(element, metrics)
  return {
    update (nextMetrics) { if (!destroyed) render(element, nextMetrics) },
    resize () {},
    destroy () { if (!destroyed) { destroyed = true; if (element) element.textContent = '' } }
  }
}
