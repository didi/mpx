function toDisplayValue (value) {
  return value === null || value === undefined ? '' : String(value)
}

function metricId (metric) {
  if (metric.id !== null && metric.id !== undefined && metric.id !== '') {
    return String(metric.id)
  }
  if (metric.key !== null && metric.key !== undefined && metric.key !== '') {
    return String(metric.key)
  }
  return ''
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element) {
    throw new Error('A chart container is required')
  }

  const root = document.createElement('div')
  root.className = 'analytics-chart__content'
  element.appendChild(root)

  let currentMetrics = []
  let destroyed = false

  const handleClick = (event) => {
    let target = event.target
    while (target && target !== root && !target.hasAttribute('data-analytics-index')) {
      target = target.parentNode
    }
    if (!target || target === root) return

    const index = Number(target.getAttribute('data-analytics-index'))
    const metric = currentMetrics[index]
    if (metric && typeof options.onSelect === 'function') {
      options.onSelect(metric.key)
    }
  }

  const render = (nextMetrics) => {
    if (destroyed) return

    currentMetrics = Array.isArray(nextMetrics) ? nextMetrics.slice() : []
    while (root.firstChild) root.removeChild(root.firstChild)

    const numericValues = currentMetrics.map((metric) => Math.abs(Number(metric.value)) || 0)
    const maximum = Math.max(1, ...numericValues)

    currentMetrics.forEach((metric, index) => {
      const button = document.createElement('button')
      const label = document.createElement('span')
      const value = document.createElement('span')
      const bar = document.createElement('span')
      const id = metricId(metric)

      button.type = 'button'
      button.className = 'analytics-chart__metric'
      button.setAttribute('data-analytics-index', String(index))
      if (id) button.id = id

      label.className = 'analytics-chart__label'
      label.textContent = toDisplayValue(metric.label)
      value.className = 'analytics-chart__value'
      value.textContent = toDisplayValue(metric.value)
      bar.className = 'analytics-chart__bar'
      bar.style.width = `${(numericValues[index] / maximum) * 100}%`

      button.setAttribute(
        'aria-label',
        `${toDisplayValue(metric.label)} ${toDisplayValue(metric.value)}`.trim()
      )
      button.appendChild(label)
      button.appendChild(value)
      button.appendChild(bar)
      root.appendChild(button)
    })
  }

  root.addEventListener('click', handleClick)
  render(metrics)

  return {
    update (nextMetrics) {
      render(nextMetrics)
    },
    resize () {
      if (!destroyed) {
        root.style.setProperty('--analytics-chart-width', `${element.clientWidth}px`)
      }
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      root.removeEventListener('click', handleClick)
      if (root.parentNode) root.parentNode.removeChild(root)
      currentMetrics = []
    }
  }
}
