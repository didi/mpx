export async function createChart (element, metrics) {
  await Promise.resolve()
  if (!element) return { update () {}, resize () {}, destroy () {} }
  const render = (nextMetrics) => { element.dataset.chartValue = (nextMetrics || []).map((item) => `${item.label}:${item.value}`).join(' | ') }
  render(metrics)
  return { update: render, resize () {}, destroy () { delete element.dataset.chartValue } }
}
