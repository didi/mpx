import {
  hasOwn,
  isArray,
  isObject,
  isIntegerKey,
  isSymbol,
  hasChanged,
  makeMap
} from '@mpxjs/utils'
import {
  reactive,
  ReactiveFlags,
  reactiveMap,
  shallowReactiveMap,
  readonlyMap,
  shallowReadonlyMap,
  toRaw,
  readonly,
  isShallow
} from './reactive'
import {
  track,
  trigger,
  ITERATE_KEY,
  pauseTracking,
  enableTracking
} from '../src/effect'
import { TriggerOpTypes } from './operations'
import { warn } from './warning'
import { isRef } from './ref'

const isNonTrackableKeys = /*#__PURE__*/ makeMap(['__proto__', '__mpx_isRef'])

const builtInSymbols = new Set(
  /* #__PURE__ */
  Object.getOwnPropertyNames(Symbol)
    // ios10.x Object.getOwnPropertyNames(Symbol) can enumerate 'arguments' and 'caller'
    // but accessing them on Symbol leads to TypeError because Symbol is a strict mode
    // function
    .filter((key) => key !== 'arguments' && key !== 'caller')
    .map((key) => Symbol[key])
    .filter(isSymbol)
)

function createArrayInstrumentations () {
  const instrumentations = {};
  // instrument identity-sensitive Array methods to account for possible reactive
  // values
  ['includes', 'indexOf', 'lastIndexOf'].forEach((key) => {
    instrumentations[key] = function (...args) {
      // avoid infinite recursion
      const arr = toRaw(this)
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, i + '')
      }
      // we run the method using the original args first (which may be reactive)
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  });

  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases
  ['push', 'pop', 'shift', 'unshift', 'splice'].forEach((key) => {
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
    const shallow = this._shallow

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (
      key === ReactiveFlags.RAW &&
      receiver ===
        (isReadonly
          ? shallow
            ? shallowReadonlyMap
            : readonlyMap
          : shallow
            ? shallowReactiveMap
            : reactiveMap
        ).get(target)
    ) {
      return target
    }

    const targetIsArray = isArray(target)

    if (!isReadonly) {
      // handle array
      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }
      if (key === 'hasOwnProperty') {
        return hasOwnProperty
      }
    }

    const res = Reflect.get(target, key, receiver)
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys[key]) {
      return res
    }

    if (!isReadonly) {
      track(target, key)
    }

    if (shallow) {
      return res
    }

    if (isRef(res)) {
      // ref unwrapping - skip unwrap for Array + integer key.
      return targetIsArray && isIntegerKey(key) ? res : res.value
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor (shallow = false) {
    super(false, shallow)
  }

  set (target, key, value, receiver) {
    let oldValue = target[key]

    // note: in shallow mode, objects are set as-is regardless of reactive or not
    if (!this._shallow) {
      if (!isShallow(value)) {
        value = toRaw(value)
        oldValue = toRaw(target[key])
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      }
    }

    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
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
    track(target, isArray(target) ? 'length' : ITERATE_KEY)
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

class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor (shallow = false) {
    super(true, shallow)
  }

  set (target, key) {
    if (__DEV__) {
      warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  }

  deleteProperty (target, key) {
    if (__DEV__) {
      warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  }
}

export const mutableHandlers = new MutableReactiveHandler()

export const shallowReactiveHandlers = new MutableReactiveHandler(true)

export const readonlyHandlers = new ReadonlyReactiveHandler()

export const shallowReadonlyHandlers = new ReadonlyReactiveHandler(true)
