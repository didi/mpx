export async function createChart (element, metrics) {
  await Promise.resolve()

  const chartRoot = document.createElement('div')
  let destroyed = false

  element.appendChild(chartRoot)

  const update = (nextMetrics) => {
    if (destroyed) return
    chartRoot.textContent = nextMetrics.map((item) => `${item.label}:${item.value}`).join(' | ')
  }

  update(metrics)

  return {
    update,
    resize () {},
    destroy () {
      if (destroyed) return
      destroyed = true
      chartRoot.remove()
    }
  }
}
