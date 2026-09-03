const chartOwners = new WeakMap()

function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics) {
  await Promise.resolve()

  let destroyed = false
  const owner = {}
  const render = (nextMetrics) => {
    if (destroyed || !element) return
    chartOwners.set(element, owner)
    element.textContent = normalizeMetrics(nextMetrics)
      .map((item) => `${item.label}:${item.value}`)
      .join(' | ')
  }

  render(metrics)

  return {
    update (nextMetrics) {
      render(nextMetrics)
    },
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      if (element && chartOwners.get(element) === owner) {
        chartOwners.delete(element)
        element.textContent = ''
      }
    }
  }
}
