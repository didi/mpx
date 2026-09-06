export async function createChart (element, metrics, onSelect) {
  await Promise.resolve()
  let destroyed = false
  if (element && 'isConnected' in element && !element.isConnected) {
    return { update () {}, resize () {}, destroy () { destroyed = true } }
  }
  const handleClick = (event) => {
    const target = event.target.closest('[data-metric-key]')
    if (target && onSelect) onSelect(target.getAttribute('data-metric-key'))
  }
  const render = (items) => {
    if (destroyed || !element) return
    element.textContent = ''
    ;(items || []).forEach((item) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.id = item.key
      button.setAttribute('data-metric-key', item.key)
      button.textContent = `${item.label}:${item.value}`
      element.appendChild(button)
    })
  }
  if (element) element.addEventListener('click', handleClick)
  render(metrics)
  return {
    update (nextMetrics) { render(nextMetrics) }, resize () {},
    destroy () {
      destroyed = true
      if (element) { element.removeEventListener('click', handleClick); element.textContent = '' }
    }
  }
}
