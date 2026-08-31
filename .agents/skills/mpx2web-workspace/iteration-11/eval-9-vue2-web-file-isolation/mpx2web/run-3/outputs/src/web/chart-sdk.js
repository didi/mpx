export async function createChart (element, metrics) {
  await Promise.resolve()

  let destroyed = false
  const render = (nextMetrics) => {
    element.textContent = nextMetrics.map((item) => `${item.label}:${item.value}`).join(' | ')
  }
  const resize = () => {}

  render(metrics)
  window.addEventListener('resize', resize)

  return {
    update (nextMetrics) {
      if (!destroyed) render(nextMetrics)
    },
    resize,
    destroy () {
      if (destroyed) return
      destroyed = true
      window.removeEventListener('resize', resize)
      element.textContent = ''
    }
  }
}
