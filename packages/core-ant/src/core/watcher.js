import {
  Reaction,
  action,
  toJS,
  isObservableArray
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
    if (type(callback) === 'Object') {
      options = callback
      callback = null
    }
    this.callback = typeof callback === 'function' ? action(callback.bind(context)) : null
    this.options = options || {}
    this.id = ++uid
    this.reaction = new Reaction(`mpx-watcher-${this.id}`, () => {
      this.update()
    })
    this.value = this.getValue()
    if (this.options.immediate && this.callback) {
      this.callback(this.value)
    }
  }

  getValue () {
    let value
    this.reaction.track(() => {
      value = this.get()
      if (this.options.deep) {
        value = toJS(value, false)
      } else if (isObservableArray(value)) {
        value.peek()
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
    if (this.value !== oldValue || isObject(this.value)) {
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
  if (typeof handler === 'function') {
    callback = handler
  } else if (type(handler) === 'Object') {
    callback = handler.handler
    options = {
      ...handler
    }
    delete options.handler
  }
  return new Watcher(context, expr, callback, options)
}
