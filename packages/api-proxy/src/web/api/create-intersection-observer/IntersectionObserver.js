let isInit = true

class WebIntersectionObserver {
  constructor (_component, options) {
    this._component = _component
    this._options = options || {}
    this._disconnected = true
    this.callback = null
  }
  initObserver (root, rootMargin) {
    if (this.observer) {
      this.observer = null
    }
    this.observer = new IntersectionObserver((entries, observer) => {
      if (!isInit || (isInit && entries[0].intersectionRatio === this._options.initialRatio && this._options.thresholds.includes(entries[0].intersectionRatio))) {
        entries.forEach(entry => {
          Object.defineProperty(entry, 'relativeRect', {
            value: entry.rootBounds || {},
            writable: false,
            enumerable: true,
            configurable: true
          });
          this.callback && this.callback(entry)
        })
      }
      isInit = false
    }, {
      root: root || null,
      rootMargin: rootMargin,
      threshold: this._options.thresholds
    })
    this._disconnected = false
  }
  disconnect () {
    this._disconnected = true
    this.observer.disconnect()
  }
  observe (targetSelector, callback) {
    if (!targetSelector) {
      const res = { errMsg: 'observe:targetSelector can not empty' }
      return Promise.reject(res)
    }
    this.callback = callback
    let targetElement = []
    if (this._options.observeAll) {
      targetElement = document.querySelectorAll(targetSelector)
    } else {
      targetElement = [document.querySelector(targetSelector)]
    }
    targetElement.forEach((element)=> { this.observer.observe(element)})
  }
  relativeTo (selector, margins = {}) {
    const { left = 0, right = 0, top = 0, bottom = 0 } = margins
    const root = document.querySelector(selector)
    const rootMargin = `${top}px ${right}px ${bottom}px ${left}px`
    this.initObserver(root, rootMargin)
    return this
  }
  relativeToViewport (margins) {
    const { left = 0, right = 0, top = 0, bottom = 0 } = margins
    const root = document.querySelector('.app')
    const rootMargin = `${top}px ${right}px ${bottom}px ${left}px`
    this.initObserver(root, rootMargin)
    return this
  }
}

export default WebIntersectionObserver
