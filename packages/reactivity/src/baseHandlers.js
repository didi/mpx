import { hasOwn, isArray, isObject, isIntegerKey, isSymbol, hasChanged } from '@mpxjs/utils'
import { reactive, ReactiveFlags, reactiveMap, toRaw } from './reactive'
import { track, trigger, ITERATE_KEY, pauseTracking, enableTracking } from '../src/effect'
import { TriggerOpTypes } from './operations'

const builtInSymbols = new Set(
  /* #__PURE__ */
  Object.getOwnPropertyNames(Symbol)
    // ios10.x Object.getOwnPropertyNames(Symbol) can enumerate 'arguments' and 'caller'
    // but accessing them on Symbol leads to TypeError because Symbol is a strict mode
    // function
    .filter(key => key !== 'arguments' && key !== 'caller')
    .map(key => Symbol[key])
    .filter(isSymbol)
)

function createArrayInstrumentations () {
  const instrumentations = {}
  // instrument identity-sensitive Array methods to account for possible reactive
  // values
  ;['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
    instrumentations[key] = function (...args) {
      // avoid infinite recursion
      const arr = toRaw(this)
      // we run the method using the original args first (which may be reactive)
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })

  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases
  ;(['push', 'pop', 'shift', 'unshift', 'splice']).forEach(key => {
    instrumentations[key] = function (...args) {
      // calls correct mutation method
      // avoid infinite recursion
      pauseTracking()
      const arr = toRaw(this)
      const res = arr[key].apply(this, args)
      enableTracking()
      return res
    }
  })
  return instrumentations
}

const arrayInstrumentations = createArrayInstrumentations()

function hasOwnProperty (key) {
  const obj = toRaw(this)
  track(obj, key)
  return obj.hasOwnProperty(key)
}

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

    const targetIsArray = isArray(target)

    // handle array
    if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }

    if (key === 'hasOwnProperty') {
      return hasOwnProperty
    }

    const res = Reflect.get(target, key, receiver)

    if (builtInSymbols.has(key)) {
      return res
    }

    track(target, key)

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
    value = toRaw(value)
    const oldValue = toRaw(target[key])
    const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)

    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      // 这里需要做一下区分：区分为 ADD、SET
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(oldValue, value)) {
        trigger(target, TriggerOpTypes.SET, key, value)
      }
    }
    return result
  }

  has (target, key) {
    const result = Reflect.has(target, key)
    track(target, key)
    return result
  }

  ownKeys (target) {
    const result = Reflect.ownKeys(target)
    track(
      target,
      ITERATE_KEY
    )
    return result
  }

  deleteProperty (target, key) {
    const hadKey = hasOwn(target, key)
    const result = Reflect.deleteProperty(target, key)
    if (result && hadKey) {
      trigger(target, TriggerOpTypes.DELETE, key)
    }
    return result
  }
}

export const mutableHandlers = new MutableReactiveHandler()
