export async function createChart (element, metrics) {
  await Promise.resolve()
  element.textContent = metrics.map((item) => `${item.label}:${item.value}`).join(' | ')
  return {
    update (nextMetrics) {
      element.textContent = nextMetrics.map((item) => `${item.label}:${item.value}`).join(' | ')
    },
    resize () {},
    destroy () {
      element.textContent = ''
    }
  }
}
