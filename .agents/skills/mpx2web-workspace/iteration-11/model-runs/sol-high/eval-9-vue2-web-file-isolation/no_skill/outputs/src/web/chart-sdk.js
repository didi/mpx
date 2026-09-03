const instances = new WeakMap()

function normalizedMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function createTextElement (className, value) {
  const element = document.createElement('span')
  element.className = className
  element.textContent = value == null ? '' : String(value)
  return element
}

export async function createChart (element, initialMetrics, options = {}) {
  await Promise.resolve()

  if (!element || (options.isCancelled && options.isCancelled())) return null

  const previous = instances.get(element)
  if (previous) previous.destroy()

  let metrics = normalizedMetrics(initialMetrics)
  let destroyed = false
  const owner = {}
  const root = document.createElement('div')
  root.className = 'analytics-chart__items'
  element.textContent = ''
  element.appendChild(root)

  function render () {
    if (destroyed) return
    root.textContent = ''
    metrics.forEach((metric, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'analytics-chart__metric'
      button.dataset.metricIndex = String(index)
      if (metric && metric.key != null) button.id = String(metric.key)
      button.appendChild(createTextElement('analytics-chart__label', metric && metric.label))
      button.appendChild(createTextElement('analytics-chart__value', metric && metric.value))
      root.appendChild(button)
    })
  }

  function handleClick (event) {
    let target = event.target
    while (target && target !== root && !target.dataset.metricIndex) {
      target = target.parentNode
    }
    if (!target || target === root) return
    const metric = metrics[Number(target.dataset.metricIndex)]
    if (metric && typeof options.onSelect === 'function') {
      options.onSelect({ key: metric.key })
    }
  }

  const chart = {
    update (nextMetrics) {
      if (destroyed) return
      metrics = normalizedMetrics(nextMetrics)
      render()
    },
    resize () {
      if (destroyed) return
      root.style.minWidth = `${element.clientWidth || 0}px`
    },
    destroy () {
      if (destroyed) return
      destroyed = true
      root.removeEventListener('click', handleClick)
      if (instances.get(element) === chart) instances.delete(element)
      if (element.__analyticsChartOwner === owner) {
        element.textContent = ''
        delete element.__analyticsChartOwner
      }
    }
  }

  element.__analyticsChartOwner = owner
  root.addEventListener('click', handleClick)
  instances.set(element, chart)
  render()
  return chart
}
