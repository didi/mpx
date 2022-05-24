import { nextTick } from '../next-tick'

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
      const initialRatio = this._options.initialRatio || 0
      const thresholds = this._options.thresholds || [0]
      entries.forEach(entry => {
        if (!isInit || (isInit && (entry.intersectionRatio !== initialRatio && thresholds.includes(entry.intersectionRatio)))) {
          Object.defineProperty(entry, 'relativeRect', {
            value: entry.rootBounds || {},
            writable: false,
            enumerable: true,
            configurable: true
          })
          this.callback && this.callback(entry)
        }
      })
      isInit = false
    }, {
      root: root || null,
      rootMargin,
      threshold: this._options.thresholds || [0]
    })
    this._disconnected = false
  }

  disconnect () {
    this._disconnected = true
    this.observer.disconnect()
  }

  observe (targetSelector, callback) {
    nextTick(() => {
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
      targetElement.forEach((element) => {
        this.observer.observe(element)
      })
    })
  }

  relativeTo (selector, margins = {}) {
    nextTick(() => {
      const { left = 0, right = 0, top = 0, bottom = 0 } = margins
      const root = document.querySelector(selector)
      const rootMargin = `${top}px ${right}px ${bottom}px ${left}px`
      this.initObserver(root, rootMargin)
    })
    return this
  }

  relativeToViewport (margins = {}) {
    nextTick(() => {
      const { left = 0, right = 0, top = 0, bottom = 0 } = margins
      const root = document.querySelector('.app')
      const screenWidth = window.screen.width || window.innerWidth
      const screenHeight = window.screen.height || window.innerHeight
      const rootWidth = root.offsetWidth || 0
      const rootHeight = root.offsetHeight || 0
      let rootMargin = ''
      if (rootHeight >= screenHeight) {
        rootMargin = `${top}px ${screenWidth - rootWidth + right}px ${screenHeight - rootHeight + bottom}px ${left}px`
      } else {
        rootMargin = `${top}px ${right}px ${bottom}px ${left}px`
      }
      this.initObserver(root, rootMargin)
    })
    return this
  }
}

export default WebIntersectionObserver
