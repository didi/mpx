import {
  Reaction,
  action,
  toJS,
  isObservableArray,
  isObservableObject,
  keys,
  isObservable
} from 'mobx'
import {
  getByPath,
  type,
  isObject
} from '../helper/utils'
import queueWatcher from './queueWatcher'

let uid = 0
export default class Watcher {
  constructor (context, expr, callback, options) {
    this.destroyed = false
    this.get = () => {
      return type(expr) === 'String' ? getByPath(context, expr) : expr()
    }
    const callbackType = type(callback)
    if (callbackType === 'Object') {
      options = callback
      callback = null
    } else if (callbackType === 'String') {
      callback = context[callback]
    }
    this.callback = typeof callback === 'function' ? action(callback.bind(context)) : null
    this.options = options || {}
    this.id = ++uid
    this.reaction = new Reaction(`mpx-watcher-${this.id}`, () => {
      this.update()
    })
    this.value = this.getValue()
    if (this.callback) {
      this.options.immediate && this.callback(this.value)
      this.options.immediateAsync && Promise.resolve().then(() => {
        this.callback(this.value)
      })
    }
  }

  getValue () {
    let value
    this.reaction.track(() => {
      value = this.get()
      if (this.options.deep) {
        const valueType = type(value)
        // 某些情况下，最外层是非isObservable 对象，比如同时观察多个属性时
        if (!isObservable(value) && (valueType === 'Array' || valueType === 'Object')) {
          if (valueType === 'Array') {
            value = value.map(item => toJS(item, false))
          } else {
            const newValue = {}
            Object.keys(value).forEach(key => {
              newValue[key] = toJS(value[key], false)
            })
            value = newValue
          }
        } else {
          value = toJS(value, false)
        }
      } else if (isObservableArray(value)) {
        value.peek()
      } else if (isObservableObject(value)) {
        keys(value)
      }
    })
    return value
  }

  update () {
    if (this.options.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  run () {
    const oldValue = this.value
    this.value = this.getValue()
    if (this.value !== oldValue || isObject(this.value) || this.options.forceCallback) {
      this.callback && this.callback(this.value, oldValue)
    }
  }

  destroy () {
    this.destroyed = true
    this.reaction.getDisposer()()
  }
}

export function watch (context, expr, handler, options) {
  let callback
  if (type(handler) === 'Object') {
    callback = handler.handler
    options = {
      ...handler
    }
    delete options.handler
  } else {
    callback = handler
  }
  return new Watcher(context, expr, callback, options)
}
