import { BEFORECREATE, CREATED, BEFOREMOUNT, UPDATED, DESTROYED } from '../../core/innerLifecycle'
import { noop } from '../../helper/utils'
import { error } from '../../helper/log'

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
            : Array.from(curComponent.querySelectorAll(selector))
          const elsArr = els.map(el => handleFields(fields, el, null))
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
    const { id, dataset, rect, size, scrollOffset, properties = [], computedStyle = [] } = fields
    const { left, right, top, bottom, width, height } = el.getBoundingClientRect()

    const res = {}
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


class NodesRef {
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
    this._selectorQuery._push(
      this._selector,
      this._component,
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
      this._single,
      fields,
      callback
    )
    return this._selectorQuery
  }
}

function getIdentifier (el) {
  let identifier = ''
  if (el) {
    if (el.id) identifier += `#${el.id}`
    if (el.className) identifier += `.${el.className.split(' ').join('.')}`
  }
  return identifier
}

function walkChildren (vm, selector, context, result, all) {
  if (vm.$children && vm.$children.length) {
    for (let i = 0; i < vm.$children.length; i++) {
      const child = vm.$children[i]
      if (child.$vnode.context === context && !child.$options.__mpx_built_in__) {
        const identifier = getIdentifier(child.$el)
        if (identifier.indexOf(selector) > -1) {
          result.push(child)
          if (all) {
            walkChildren(child, selector, context, result, all)
          } else {
            return
          }
        }
      }
    }
  }
}

function getEl (ref) {
  if (ref && ref.nodeType === 1) return ref
  if (ref && ref.$options && ref.$options.__mpx_built_in__) return ref.$el
}

function processRefs (refs) {
  Object.keys(refs).forEach((key) => {
    const matched = /^__mpx_ref_([^_]+)__$/.exec(key)
    const rKey = matched && matched[1]
    if (rKey) {
      const ref = refs[key]
      if (Array.isArray(ref)) {
        if (getEl(ref[0])) {
          refs[rKey] = new SelectQuery().in(this).selectAll(ref.map(getEl))
        } else {
          refs[rKey] = ref
        }
      } else {
        if (getEl(ref)) {
          return new SelectQuery().in(this).select(getEl(ref))
        } else {
          refs[rKey] = ref
        }
      }
    }
  })
}

export default function getRefsMixin () {
  return {
    [BEFOREMOUNT] () {
      processRefs(this.$refs || {})
    },
    [UPDATED] () {
      processRefs(this.$refs || {})
    },
    methods: {
      createSelectorQuery () {
        return new SelectQuery().in(this)
      },
      selectComponent (selector, all) {
        const result = []
        walkChildren(this, selector, this, result, all)
        if (selector.lastIndexOf('.') > 0) {
          const location = this.__mpxProxy && this.__mpxProxy.options.mpxFileResource
          error('The selectComponent or selectAllComponents only supports the single selector, a composed selector is not supported.', location)
        }
        return all ? result : result[0]
      },
      selectAllComponents (selector) {
        return this.selectComponent(selector, true)
      }
    }
  }
}
