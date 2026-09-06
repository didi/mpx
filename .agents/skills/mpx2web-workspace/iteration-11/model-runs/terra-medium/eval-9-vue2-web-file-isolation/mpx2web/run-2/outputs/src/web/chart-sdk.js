export async function createChart (element, metrics) {
  await Promise.resolve()

  if (!element) {
    return {
      update () {},
      resize () {},
      destroy () {}
    }
  }

  let destroyed = false
  const render = (nextMetrics) => {
    if (destroyed) return
    const list = Array.isArray(nextMetrics) ? nextMetrics : []
    element.setAttribute('data-chart-summary', list.map((item) => `${item.label}:${item.value}`).join(' | '))
  }

  render(metrics)

  return {
    update: render,
    resize () {},
    destroy () {
      destroyed = true
      element.removeAttribute('data-chart-summary')
    }
  }
}
