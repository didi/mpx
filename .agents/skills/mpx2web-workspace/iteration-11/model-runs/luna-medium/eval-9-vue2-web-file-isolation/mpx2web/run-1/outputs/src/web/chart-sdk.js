export async function createChart (element, metrics) {
  await Promise.resolve()
  if (!element) return null
  const render = (nextMetrics) => {
    if (element.isConnected !== false) element.textContent = nextMetrics.map((item) => `${item.label}:${item.value}`).join(' | ')
  }
  render(metrics || [])
  return {
    update (nextMetrics) { render(nextMetrics || []) },
    resize () {},
    destroy () {
      element.textContent = ''
    }
  }
}
