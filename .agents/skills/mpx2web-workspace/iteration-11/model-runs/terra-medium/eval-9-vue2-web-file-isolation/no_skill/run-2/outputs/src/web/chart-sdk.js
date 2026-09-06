function normalizeMetrics (metrics) {
  return Array.isArray(metrics) ? metrics : []
}

export async function createChart (element, metrics, options) {
  options = options || {}
  var destroyed = false
  var onSelect = typeof options.onSelect === 'function' ? options.onSelect : function () {}

  // Keep the asynchronous boundary used by the real SDK, while allowing callers
  // to reject this instance safely if their component is replaced meanwhile.
  await Promise.resolve()

  function render (nextMetrics) {
    if (destroyed || !element) return
    element.textContent = ''
    normalizeMetrics(nextMetrics).forEach(function (item) {
      var metric = item || {}
      var button = document.createElement('button')
      button.type = 'button'
      button.className = 'analytics-chart__metric'
      if (metric.key != null) button.id = String(metric.key)
      button.textContent = String(metric.label == null ? '' : metric.label) + ':' + String(metric.value == null ? '' : metric.value)
      button.addEventListener('click', function () {
        if (!destroyed) onSelect(metric.key)
      })
      element.appendChild(button)
    })
  }

  render(metrics)
  return {
    update: render,
    resize: function () {},
    destroy: function () {
      destroyed = true
      if (element) element.textContent = ''
    }
  }
}
