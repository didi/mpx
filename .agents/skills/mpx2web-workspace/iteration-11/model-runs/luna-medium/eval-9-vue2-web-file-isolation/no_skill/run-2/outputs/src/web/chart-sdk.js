function escapeHtml (value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function render (element, metrics) {
  element.innerHTML = (metrics || []).map(item => {
    const key = escapeHtml(item && item.key)
    return `<button type="button" class="analytics-chart__metric" data-key="${key}" id="metric-${key}">${escapeHtml(item && item.label)}:${escapeHtml(item && item.value)}</button>`
  }).join('')
}

export async function createChart (element, metrics, onSelect) {
  await Promise.resolve()
  if (!element) throw new Error('Analytics chart element is missing')
  let disposed = false
  const handleClick = event => {
    const metric = event.target.closest && event.target.closest('[data-key]')
    if (!disposed && metric && element.contains(metric) && onSelect) onSelect(metric.dataset.key)
  }
  render(element, metrics)
  element.addEventListener('click', handleClick)
  return {
    update (nextMetrics) { if (!disposed) render(element, nextMetrics) },
    resize () {},
    destroy () {
      if (disposed) return
      disposed = true
      element.removeEventListener('click', handleClick)
      element.textContent = ''
    }
  }
}
