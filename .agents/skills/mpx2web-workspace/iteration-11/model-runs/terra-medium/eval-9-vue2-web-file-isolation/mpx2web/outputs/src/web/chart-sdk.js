export async function createChart (element, metrics = []) {
  await Promise.resolve()
  if (!element) return null

  let destroyed = false
  function render (nextMetrics = []) {
    if (destroyed) return
    element.textContent = nextMetrics.map((item) => `${item.label}:${item.value}`).join(' | ')
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
      element.textContent = ''
    }
  }
}
