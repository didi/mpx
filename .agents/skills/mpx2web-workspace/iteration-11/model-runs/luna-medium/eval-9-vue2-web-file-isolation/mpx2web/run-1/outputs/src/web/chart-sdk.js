export async function createChart (element) {
  await Promise.resolve()
  return {
    update (metrics) {
      if (!element || element.isConnected === false) return
      element.textContent = (metrics || []).map((item) => `${item.label}:${item.value}`).join(' | ')
    },
    resize () {},
    destroy () {
      if (element && element.isConnected !== false) element.textContent = ''
    }
  }
}
