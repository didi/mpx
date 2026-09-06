function normaliseMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

function createInactiveChart () {
  return {
    update: function () {},
    resize: function () {},
    destroy: function () {}
  }
}

export async function createChart (element, metrics, options) {
  var config = options || {}
  // A real chart library can resolve after navigation.  Keep this boundary async
  // and let the caller invalidate it before it is allowed to touch the DOM.
  await Promise.resolve()
  if (!element || (config.isActive && !config.isActive())) return createInactiveChart()

  var destroyed = false
  var currentMetrics = []
  var onClick = function (event) {
    var target = event.target
    while (target && target !== element && (target.nodeType !== 1 || !target.hasAttribute('data-metric-key'))) target = target.parentNode
    if (!target || target === element || target.nodeType !== 1 || destroyed || !config.onSelect) return
    config.onSelect({ key: target.getAttribute('data-metric-key') })
  }

  function render (nextMetrics) {
    if (destroyed) return
    currentMetrics = normaliseMetrics(nextMetrics)
    element.textContent = ''
    var fragment = document.createDocumentFragment()
    currentMetrics.forEach(function (metric) {
      var button = document.createElement('button')
      button.type = 'button'
      button.className = 'analytics-chart__metric'
      button.setAttribute('data-metric-key', metric.key)
      button.textContent = String(metric.label) + ':' + String(metric.value)
      fragment.appendChild(button)
    })
    element.appendChild(fragment)
  }

  element.addEventListener('click', onClick)
  render(metrics)
  return {
    update: render,
    resize: function () {},
    destroy: function () {
      if (destroyed) return
      destroyed = true
      element.removeEventListener('click', onClick)
      element.textContent = ''
      currentMetrics = []
    }
  }
}
