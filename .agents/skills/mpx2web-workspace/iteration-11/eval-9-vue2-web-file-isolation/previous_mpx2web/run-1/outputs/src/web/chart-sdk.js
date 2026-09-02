function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function clearElement (element) {
  while (element.firstChild) element.removeChild(element.firstChild)
}

export async function createChart (element, metrics, options = {}) {
  await Promise.resolve()

  if (!element) throw new Error('A chart container is required')

  let destroyed = false
  let currentMetrics = normalizeMetrics(metrics)
  const ownerDocument = element.ownerDocument

  function render () {
    if (destroyed) return

    clearElement(element)
    const numericValues = currentMetrics.map((item) => {
      const value = Number(item && item.value)
      return Number.isFinite(value) ? Math.abs(value) : 0
    })
    const maxValue = Math.max(1, ...numericValues)

    currentMetrics.forEach((metric, index) => {
      const item = metric || {}
      const button = ownerDocument.createElement('button')
      const bar = ownerDocument.createElement('span')
      const label = ownerDocument.createElement('span')
      const value = ownerDocument.createElement('span')
      const metricId = item.id !== undefined ? item.id : item.key

      button.type = 'button'
      button.className = 'analytics-chart__metric'
      button.dataset.metricIndex = String(index)
      if (metricId !== undefined && metricId !== null && metricId !== '') {
        button.id = String(metricId)
      }

      bar.className = 'analytics-chart__bar'
      bar.setAttribute('aria-hidden', 'true')
      bar.style.setProperty(
        '--analytics-bar-height',
        `${Math.max(2, (numericValues[index] / maxValue) * 88)}px`
      )

      label.className = 'analytics-chart__label'
      label.textContent = item.label === undefined ? '' : String(item.label)

      value.className = 'analytics-chart__value'
      value.textContent = item.value === undefined ? '' : String(item.value)

      button.setAttribute('aria-label', `${label.textContent}: ${value.textContent}`)
      button.appendChild(bar)
      button.appendChild(label)
      button.appendChild(value)
      element.appendChild(button)
    })
  }

  function handleClick (event) {
    let target = event.target
    while (target && target !== element && !target.dataset.metricIndex) target = target.parentNode
    if (!target || target === element) return

    const index = Number(target.dataset.metricIndex)
    const metric = currentMetrics[index]
    if (!metric || typeof options.onSelect !== 'function') return
    options.onSelect({ key: metric.key })
  }

  function update (nextMetrics) {
    if (destroyed) return
    currentMetrics = normalizeMetrics(nextMetrics)
    render()
  }

  function resize () {
    if (destroyed) return
    element.style.setProperty('--analytics-chart-width', `${element.clientWidth}px`)
  }

  element.addEventListener('click', handleClick)
  render()
  resize()

  return {
    update,
    resize,
    destroy () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', handleClick)
      element.style.removeProperty('--analytics-chart-width')
      clearElement(element)
    }
  }
}
