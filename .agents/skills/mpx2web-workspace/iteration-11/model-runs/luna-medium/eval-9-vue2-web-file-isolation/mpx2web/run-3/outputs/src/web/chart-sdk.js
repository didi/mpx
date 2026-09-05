export async function createChart (element, metrics, onSelect) {
  await Promise.resolve()
  if (!element) return { destroy () {} }
  let currentMetrics = Array.isArray(metrics) ? metrics : []
  const handleClick = (event) => {
    const item = event.target.closest && event.target.closest('[data-metric-key]')
    if (item && element.contains(item) && onSelect) onSelect({ key: item.getAttribute('data-metric-key') })
  }
  element.addEventListener('click', handleClick)
  const render = () => {
    element.textContent = ''
    currentMetrics.forEach((item) => {
      const button = document.createElement('button'); button.type = 'button'
      button.setAttribute('data-metric-key', item.key); button.textContent = `${item.label}:${item.value}`
      element.appendChild(button)
    })
  }
  render()
  return {
    update (nextMetrics) { currentMetrics = Array.isArray(nextMetrics) ? nextMetrics : []; render() },
    resize () {},
    destroy () { element.removeEventListener('click', handleClick); element.textContent = '' }
  }
}
