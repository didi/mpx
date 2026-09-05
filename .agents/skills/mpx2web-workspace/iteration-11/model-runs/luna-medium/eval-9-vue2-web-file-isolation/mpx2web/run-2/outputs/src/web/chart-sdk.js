export async function createChart (element, metrics = []) {
  await Promise.resolve()
  const render = (nextMetrics) => { if (element) element.textContent = (nextMetrics || []).map((item) => `${item.label}:${item.value}`).join(' | ') }
  render(metrics)
  let destroyed = false
  return {
    update (nextMetrics) { if (!destroyed) render(nextMetrics) },
    resize () {},
    destroy () { if (!destroyed) { destroyed = true; if (element) element.textContent = '' } }
  }
}
