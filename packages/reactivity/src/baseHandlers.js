import { ReactiveFlags } from './reactive'

class BaseReactiveHandler {
  constructor (_isReadonly = false, _shallow = false) {
    this._isReadonly = _isReadonly
    this._shallow = _shallow
  }

  get (target, key, receiver) {
    const isReadonly = this._isReadonly

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    }

    const res = target[key]

    return res
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor (shallow = false) {
    super(false, shallow)
  }

  set (target, key, value, receiver) {
    target[key] = value
  }

  has (target, key) {
    const result = Reflect.has(target, key)
    return result
  }

  ownKeys (target) {
    const result = Reflect.ownKeys(target)
    return result
  }
}

export const mutableHandlers = new MutableReactiveHandler()
