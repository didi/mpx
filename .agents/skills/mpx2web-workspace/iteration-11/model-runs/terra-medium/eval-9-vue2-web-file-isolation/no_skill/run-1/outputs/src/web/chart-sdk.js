function emptyChart () {
  return { update () {}, resize () {}, destroy () {} }
}

export async function createChart (element, metrics, options = {}) {
  // Real chart SDKs commonly resolve asynchronously.  Honour cancellation on
  // both sides of that boundary so a late chart never writes into a new view.
  await Promise.resolve()
  if (!element || (options.isCancelled && options.isCancelled())) return emptyChart()

  let destroyed = false
  let currentMetrics = []

  const render = (nextMetrics) => {
    if (destroyed || !element) return
    currentMetrics = Array.isArray(nextMetrics) ? nextMetrics : []
    while (element.firstChild) element.removeChild(element.firstChild)

    const list = document.createElement('div')
    list.className = 'analytics-chart__metrics'
    currentMetrics.forEach((metric) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'analytics-chart__metric'
      item.id = metric.key || ''
      item.textContent = `${metric.label}: ${metric.value}`
      item.addEventListener('click', () => {
        if (!destroyed && options.onSelect) options.onSelect(metric.key, metric)
      })
      list.appendChild(item)
    })
    element.appendChild(list)
  }

  render(metrics)
  return {
    update (nextMetrics) { render(nextMetrics) },
    resize () {
      // Rendering is flow-based; the method remains an SDK-compatible hook.
      if (!destroyed) render(currentMetrics)
    },
    destroy () {
      destroyed = true
      if (element) while (element.firstChild) element.removeChild(element.firstChild)
    }
  }
}
