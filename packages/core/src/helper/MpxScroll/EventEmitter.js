export default class EventEmitter {
  constructor () {
    this.disposer = []
  }

  on (handler) {
    this.disposer.push(handler)
    return this
  }

  emit (...args) {
    this.disposer.forEach(handler => handler(...args))
    return this
  }

  destroy () {
    this.disposer = []
    return this
  }
}
