const activeCharts = new WeakMap()

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element || element.nodeType !== 1) {
    throw new TypeError('createChart requires a mounted element')
  }

  const activeChart = activeCharts.get(element)
  if (activeChart) {
    activeChart.destroy()
  }

  const ownerDocument = element.ownerDocument
  const plot = ownerDocument.createElement('div')
  plot.className = 'analytics-chart__plot'
  element.appendChild(plot)

  let currentMetrics = []
  let destroyed = false

  const handleClick = (event) => {
    let target = event.target
    while (target && target !== plot && !target.hasAttribute('data-analytics-index')) {
      target = target.parentNode
    }
    if (!target || target === plot) return

    const index = Number(target.getAttribute('data-analytics-index'))
    const metric = currentMetrics[index]
    if (!metric || typeof options.onSelect !== 'function') return
    options.onSelect({ key: metric.key })
  }

  plot.addEventListener('click', handleClick)

  const instance = {
    update (nextMetrics) {
      if (destroyed) return
      currentMetrics = Array.isArray(nextMetrics) ? nextMetrics.slice() : []

      while (plot.firstChild) {
        plot.removeChild(plot.firstChild)
      }

      const fragment = ownerDocument.createDocumentFragment()
      currentMetrics.forEach((metric, index) => {
        const button = ownerDocument.createElement('button')
        const label = ownerDocument.createElement('span')
        const value = ownerDocument.createElement('span')

        button.type = 'button'
        button.className = 'analytics-chart__metric'
        button.setAttribute('data-analytics-index', String(index))
        if (metric && metric.id !== undefined && metric.id !== null) {
          button.id = String(metric.id)
        } else if (metric && metric.key !== undefined && metric.key !== null) {
          button.id = String(metric.key)
        }

        label.className = 'analytics-chart__metric-label'
        label.textContent = metric && metric.label !== undefined
          ? String(metric.label)
          : ''
        value.className = 'analytics-chart__metric-value'
        value.textContent = metric && metric.value !== undefined
          ? String(metric.value)
          : ''

        button.appendChild(label)
        button.appendChild(value)
        fragment.appendChild(button)
      })
      plot.appendChild(fragment)
    },
    resize () {
      if (destroyed) return
      plot.style.minHeight = `${Math.max(160, element.clientHeight || 0)}px`
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      plot.removeEventListener('click', handleClick)
      if (plot.parentNode === element) {
        element.removeChild(plot)
      }
      currentMetrics = []
      if (activeCharts.get(element) === instance) {
        activeCharts.delete(element)
      }
    }
  }

  activeCharts.set(element, instance)
  instance.update(metrics)
  instance.resize()
  return instance
}
