import { isObject } from '@mpxjs/utils'
import { reactive, ReactiveFlags, reactiveMap } from './reactive'

class BaseReactiveHandler {
  constructor (_isReadonly = false, _shallow = false) {
    this._isReadonly = _isReadonly
    this._shallow = _shallow
  }

  get (target, key, receiver) {
    const isReadonly = this._isReadonly

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.RAW && receiver === reactiveMap.get(target)) {
      return target
    }

    const res = target[key]

    if (isObject(res)) {
      return reactive(res)
    }

    return res
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor (shallow = false) {
    super(false, shallow)
  }

  set (target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver)
    return result
  }

  has (target, key) {
    const result = Reflect.has(target, key)
    return result
  }

  ownKeys (target) {
    const result = Reflect.ownKeys(target)
    return result
  }

  deleteProperty (target, key) {
    const result = Reflect.deleteProperty(target, key)
    return result
  }
}

export const mutableHandlers = new MutableReactiveHandler()
