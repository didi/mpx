export default class ScrollAnimation {
  easeOutQuart (time, beginPosition, endPosition, callback) {
    const startTime = Date.now()
    const endTime = startTime + time
    const bounceFn = t => 1 - (--t) * t * t * t
    let timer = null
    const scheduler = () => {
      const now = Date.now()
      if (now >= endTime) {
        window.cancelAnimationFrame(timer)
        timer = null
        return
      }
      const ratio = bounceFn((now - startTime) / time)
      const currentPosition = ratio * (endPosition - beginPosition) + beginPosition
      callback(Math.floor(currentPosition))
      timer = window.requestAnimationFrame(scheduler)
    }
    scheduler()
  }
}
