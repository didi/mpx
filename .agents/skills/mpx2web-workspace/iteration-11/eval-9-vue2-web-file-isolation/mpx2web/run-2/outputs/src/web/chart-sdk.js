export async function createChart (element, metrics) {
  await Promise.resolve()

  const resize = () => {}
  window.addEventListener('resize', resize)
  element.textContent = formatMetrics(metrics)

  return {
    update (nextMetrics) {
      element.textContent = formatMetrics(nextMetrics)
    },
    resize,
    destroy () {
      window.removeEventListener('resize', resize)
      element.textContent = ''
    }
  }
}

function formatMetrics (metrics) {
  return metrics.map((item) => `${item.label}:${item.value}`).join(' | ')
}
