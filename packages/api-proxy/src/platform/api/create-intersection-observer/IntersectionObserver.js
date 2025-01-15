import { nextTick } from '../next-tick'
import { parseDataset } from '@mpxjs/utils'

let isInit = true

class WebIntersectionObserver {
  constructor (_component, options) {
    this._component = _component
    this._options = options || {}
    this._relativeInfo = []
    this._callback = null
    this._observer = null
    this._root = null
    this._rootMargin = ''
    this._disconnected = false
    this._minThreshold = this.getMinThreshold()
  }

  initObserver () {
    if (this._observer) {
      this._observer = null
    }
    this._disconnected = false
    // eslint-disable-next-line no-undef
    return new IntersectionObserver((entries, observer) => {
      const initialRatio = this._options.initialRatio || 0
      entries.forEach(entry => {
        if (!isInit || (isInit && (entry.intersectionRatio !== initialRatio && (this._minThreshold <= entry.intersectionRatio)))) {
          Object.defineProperties(entry, {
            id: {
              get () {
                return entry.target.id || ''
              },
              enumerable: true,
              configurable: true
            },
            dataset: {
              get () {
                return parseDataset(entry.target.dataset)
              },
              enumerable: true,
              configurable: true
            },
            relativeRect: {
              value: entry.rootBounds || {},
              writable: false,
              enumerable: true,
              configurable: true
            },
            time: {
              value: new Date().valueOf(),
              writable: false,
              enumerable: true,
              configurable: true
            }
          })
          this._callback && this._callback(entry)
        }
      })
      isInit = false
    }, {
      root: this._root || null,
      rootMargin: this._rootMargin,
      threshold: this._options.thresholds || [0]
    })
  }

  observe (targetSelector, callback) {
    nextTick(() => {
      if (!document.querySelector(targetSelector)) {
        console.warn(`[mpx runtime warn]: Node ${JSON.stringify(targetSelector)} is not found. Intersection observer will not trigger.`)
        return
      }
      this._observer = this.initObserver()
      this._callback = callback
      let targetElement = []
      if (this._options.observeAll) {
        targetElement = [...document.querySelectorAll(targetSelector)]
      } else {
        targetElement = [document.querySelector(targetSelector)]
      }
      targetElement.forEach((element) => {
        this._observer && this._observer.observe(element)
      })
    })
  }

  relativeTo (selector, margins) {
    nextTick(() => {
      const marginsTemp = margins || {}
      const { left = 0, right = 0, top = 0, bottom = 0 } = marginsTemp
      this._root = document.querySelector(selector)
      this._rootMargin = `${top}px ${right}px ${bottom}px ${left}px`
      this._relativeInfo.push({ selector, margins })
    })
    return this
  }

  relativeToViewport (margins) {
    nextTick(() => {
      const marginsTemp = margins || {}
      const { left = 0, right = 0, top = 0, bottom = 0 } = marginsTemp
      this._root = null
      this._rootMargin = `${top}px ${right}px ${bottom}px ${left}px`
      this._relativeInfo.push({ selector: null, margins })
    })
    return this
  }

  disconnect () {
    this._disconnected = true
    this._observer.disconnect()
  }

  getMinThreshold () {
    const thresholds = this._options.thresholds || [0]
    const thresholdsSortArr = thresholds.sort((a, b) => a - b)
    return thresholdsSortArr[0] || 0
  }
}

export default WebIntersectionObserver
