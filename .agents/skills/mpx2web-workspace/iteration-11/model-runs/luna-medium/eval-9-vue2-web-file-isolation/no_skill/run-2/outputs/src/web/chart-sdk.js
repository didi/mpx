function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function render (element, metrics) {
  if (!element) return
  element.textContent = normalizeMetrics(metrics)
    .map(item => `${item.label}:${item.value}`)
    .join(' | ')
}

export function createChart (element, metrics) {
  let destroyed = false
  let version = 0

  const draw = (nextMetrics, expectedVersion) => {
    Promise.resolve().then(() => {
      if (!destroyed && expectedVersion === version) render(element, nextMetrics)
    })
  }

  draw(metrics, version)
  return {
    update (nextMetrics) {
      version += 1
      draw(nextMetrics, version)
    },
    resize () {},
    destroy () {
      destroyed = true
      version += 1
      if (element) element.textContent = ''
    }
  }
}
