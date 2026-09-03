function normaliseMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics) {
  // Simulate an asynchronously loaded chart package while keeping ownership local.
  await Promise.resolve()
  if (!element) throw new Error('A chart element is required')

  let destroyed = false
  let currentMetrics = normaliseMetrics(metrics)
  const render = (nextMetrics) => {
    if (destroyed) return
    currentMetrics = normaliseMetrics(nextMetrics)
    const items = currentMetrics
    const max = Math.max(1, ...items.map((item) => Number(item.value) || 0))
    element.innerHTML = items.map((item) => {
      const value = Number(item.value) || 0
      const width = Math.max(0, Math.min(100, (value / max) * 100))
      return '<div class="analytics-chart-bar" aria-label="' + String(item.label) + ': ' + String(item.value) + '">' +
        '<span>' + String(item.label) + '</span><i style="width:' + width + '%"></i><b>' + String(item.value) + '</b></div>'
    }).join('')
  }

  render(metrics)
  return {
    update: render,
    resize: function () { render(currentMetrics) },
    destroy: function () {
      destroyed = true
      element.textContent = ''
    }
  }
}
