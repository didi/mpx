const DEFAULT_INTERVAL = 100 / 60

export const requestAnimationFrame = (() => {
  return function (callback) {
    return setTimeout(callback, (callback.interval || DEFAULT_INTERVAL) / 2) // make interval as precise as possible.
  }
})()

export const cancelAnimationFrame = (() => {
  return function (id) {
    clearTimeout(id)
  }
})()
