interface NodesRefH5 {
  boundingClientRect(callback?: WechatMiniprogram.BoundingClientRectCallback): SelectorQueryH5
  fields(fields: WechatMiniprogram.Fields, callback?: WechatMiniprogram.FieldsCallback): SelectorQueryH5
  scrollOffset(callback?: WechatMiniprogram.ScrollOffsetCallback): SelectorQueryH5
}

interface SelectorQueryH5 {
  exec(callback?: (...args: any[]) => any,): void
  select(selector: string): NodesRefH5
  selectAll(selector: string): NodesRefH5
  selectViewport(): NodesRefH5
  in(component: any): SelectorQueryH5
}

class NodesRef {
  _selector: string
  _selectorQuery: any
  _component: any
  _single: boolean
  constructor (selector, selectorQuery, single) {
    this._selector = selector
    this._selectorQuery = selectorQuery
    this._component = selectorQuery._component
    this._single = single
  }
  boundingClientRect (callback) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._selectorQuery,
      this._single,
      {
        id: true,
        dataset: true,
        rect: true,
        size: true
      },
      callback
    )
    return this._selectorQuery
  }
  scrollOffset (callback) {
    this._selectorQuery.push(
      this._selector,
      this._component,
      this._selectorQuery,
      this._single,
      {
        id: true,
        dataset: true,
        scrollOffset: true
      },
      callback
    )
    return this._selectorQuery
  }
  fields (fields, callback) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._selectorQuery,
      this._single,
      fields,
      callback
    )
    return this._selectorQuery
  }
}

class SelectQuery {
  _component: any = null
  _queue: any[] = []
  _queueCb: any[] = []
  constructor () {}
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
      const curComponent: HTMLDivElement  = component || document // TODO handle component

      if (single) {
        const el = curComponent.querySelector(selector)
        res.push(handleFields(fields, el, selector))
      } else {
        const els = curComponent.querySelectorAll(selector)
        const elsArr = Array.from(els).map(el => handleFields(fields, el, null))
        res.push(elsArr)
      }
    })

    res.forEach((item, idx) => {
      typeof queueCb[idx] === 'function' && queueCb[idx].call(this, item)
    })
    typeof callback === 'function' && callback.call(this, res)
  }
  _handleFields (fields, el: HTMLDivElement, selector) {
    const { id, dataset, rect, size, scrollOffset, properties = [], computedStyle = [] } = fields
    const { left, right, top, bottom, width, height } = el.getBoundingClientRect()
    interface HandleResult {
      id?: string,
      dataset?: Object,
      left?: number,
      right?: number,
      top?: number,
      bottom?: number,
      width?: number,
      height?: number,
      scrollLeft?: number,
      scrollTop?: number,
      [key: string]: any
    }

    const res: HandleResult = {}
    const isViewport = selector === 'html'
    if (id) res.id = el.id
    if (dataset) res.dataset = Object.assign({}, el.dataset)
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
    if (scrollOffset) {
      res.scrollLeft = el.scrollLeft
      res.scrollTop = el.scrollTop
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
        const value = styles.getPropertyValue(style)
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
}

function createSelectorQuery (): SelectorQueryH5 {
  return new SelectQuery()
}

export {
  createSelectorQuery
}
