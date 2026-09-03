export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()
  let disposed = false
  const onSelect = typeof options.onSelect === 'function' ? options.onSelect : null

  const render = nextMetrics => {
    if (disposed || !element) return
    element.textContent = ''
    ;(Array.isArray(nextMetrics) ? nextMetrics : []).forEach(item => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'analytics-chart__metric'
      button.id = item.id || item.key || ''
      button.setAttribute('data-metric-key', item.key)
      button.textContent = `${item.label}:${item.value}`
      element.appendChild(button)
    })
  }
  const clickHandler = event => {
    const target = event.target.closest('[data-metric-key]')
    if (target && onSelect) onSelect(target.getAttribute('data-metric-key'))
  }
  if (!element || disposed) return { update () {}, resize () {}, destroy () {} }
  element.addEventListener('click', clickHandler)
  render(metrics)
  return {
    update: render,
    resize () {},
    destroy () {
      if (disposed) return
      disposed = true
      element.removeEventListener('click', clickHandler)
      element.textContent = ''
    }
  }
}
