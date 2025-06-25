import NodesRef from './NodesRef'
import { parseDataset } from '@mpxjs/utils'

class SelectQuery {
  constructor () {
    this._component = null
    this._queue = []
    this._queueCb = []
  }

  in (component) {
    this._component = component
    return this
  }

  select (selector) {
    if (typeof selector === 'string') {
      selector = selector.replace('>>>', '>')
    }
    return new NodesRef(selector, this, true)
  }

  selectAll (selector) {
    if (typeof selector === 'string') {
      selector = selector.replace('>>>', '>')
    }
    return new NodesRef(selector, this, false)
  }

  selectViewport () {
    return new NodesRef('html', this, true)
  }

  exec (callback) {
    const res = []
    const handleFields = this._handleFields
    const queueCb = this._queueCb
    this._queue.forEach(item => {
      const { selector, component, single, fields } = item

      let curComponent = document
      if (component && component.$el) {
        curComponent = component.$el
      } else if (component && component.nodeType === 1) {
        curComponent = component
      }
      if (this._isEl(selector)) {
        if (single) {
          res.push(handleFields(fields, selector, null))
        } else {
          res.push(selector.map(el => handleFields(fields, el, null)))
        }
      } else {
        const selectSelf =
          curComponent === document
            ? false
            : Array
              .from(curComponent.parentNode.querySelectorAll(selector))
              .every(item => item === curComponent)
        if (single) {
          const el = selectSelf ? curComponent : curComponent.querySelector(selector)
          res.push(handleFields(fields, el, selector))
        } else {
          const els = selectSelf
            ? [curComponent]
            : curComponent.querySelectorAll(selector)
          const elsArr = Array.from(els).map(el => handleFields(fields, el, null))
          res.push(elsArr)
        }
      }
    })
    res.forEach((item, idx) => {
      typeof queueCb[idx] === 'function' && queueCb[idx].call(this, item)
    })
    typeof callback === 'function' && callback.call(this, res)
  }

  _handleFields (fields, el, selector) {
    if (!el || (el && !el.getBoundingClientRect)) return null
    const { id, dataset, rect, size, scrollOffset, properties = [], computedStyle = [], node } = fields
    const { left, right, top, bottom, width, height } = el.getBoundingClientRect()

    const res = {}
    const isViewport = selector === 'html'
    if (id) res.id = el.id
    if (dataset) res.dataset = parseDataset(el.dataset)
    if (rect) {
      if (isViewport) {
        res.left = 0
        res.right = 0
        res.top = 0
        res.bottom = 0
      } else {
        res.left = left
        res.right = right
        res.top = top
        res.bottom = bottom
      }
    }
    if (size) {
      if (isViewport) {
        res.width = el.clientWidth
        res.height = el.clientHeight
      } else {
        res.width = width
        res.height = height
      }
    }
    // 添加获取节点信息
    if (node) {
      res.node = el
      // 如果是canvas节点，需要做特殊处理
      if (isCanvas(el)) {
        // 避免lint检查报错
        el.createImage = function () {
          return new Image()  // eslint-disable-line
        }

        el.createPath2D = function (path) {
          return window.Path2D(path)
        }

        el.requestAnimationFrame = function (callback) {
          return window.requestAnimationFrame(callback)
        }

        el.cancelAnimationFrame = function (requestID) {
          return window.cancelAnimationFrame(requestID)
        }

        const rawGetContext = el.getContext
        el.getContext = function (...args) {
          const context = rawGetContext.apply(this, args)
          // 如果实例方法有变动，可以在这里进行处理
          return context
        }
      }
      //如果是 scrollView 节点
      if (el.className && el.className.indexOf('mpx-scroll-view') > -1 && el.isBScrollContainer) {
        el.scrollTo = function (...args) {
          el?.__vue__?.scrollTo(...args)
        }
        el.scrollIntoView = function (...args) {
          el?.__vue__?.handleScrollIntoView(...args)
        }
      }
    }
    if (scrollOffset) {
      if (el.isBScrollContainer) {
        const bs = el?.__vue__?.bs
        res.scrollLeft = -bs.x
        res.scrollTop = -bs.y
      } else {
        res.scrollLeft = el.scrollLeft
        res.scrollTop = el.scrollTop
      }
      res.scrollHeight = el.scrollHeight
      res.scrollWidth = el.scrollWidth
    }
    properties.forEach(prop => {
      const attr = el.getAttribute(prop)
      if (attr) {
        res[prop] = attr
      }
    })
    if (computedStyle.length) {
      const styles = window.getComputedStyle(el)
      computedStyle.forEach(style => {
        const midLineStyle = style.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
        const value = styles.getPropertyValue(midLineStyle)
        if (value) {
          res[style] = value
        }
      })
    }
    return res
  }

  _push (selector, component, single, fields, callback) {
    this._queue.push({
      component,
      selector,
      single,
      fields
    })
    this._queueCb.push(callback)
  }

  _isEl (selector) {
    if (Array.isArray(selector)) return this._isEl(selector[0])
    return selector && selector.nodeType === 1
  }
}

export default SelectQuery

// 判断是不是canvas元素
function isCanvas (el) {
  return el.nodeName && el.nodeName.toLowerCase() === 'canvas'
}
