import { isFunction, isObject, isPlainObject, isArray, hasChanged } from '@mpxjs/utils'
import { isReactive, toRaw, toReactive, isShallow, isReadonly } from './reactive'

class RefImpl {
  __mpx_isRef = true;
  constructor (value, shallow) {
    this._rawValue = shallow ? value : toRaw(value)
    this.__mpx_isShallow = shallow
    this._value = shallow ? value : toReactive(value)
  }

  get value () {
    return this._value
  }

  set value (newVal) {
    const useDirectValue =
      this.__mpx_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = useDirectValue ? newVal : toReactive(newVal)
    }
  }
}

class GetterRefImpl {
  __mpx_isRef = true;
  __mpx_isReadonly = true;
  constructor (getter) {
    this._getter = getter
  }

  get value () {
    return this._getter()
  }

  set value (newVal) {
    if (__DEV__) {
      console.warn(`getterRef cannot be set: ${String(newVal)}`)
    }
  }
}

class ObjectRefImpl {
  __mpx_isRef = true;
  constructor (source, key, defaultValue) {
    this._object = source
    this._key = key
    this._defaultValue = defaultValue
  }

  get value () {
    const val = this._object[this._key]
    return val === undefined ? this._defaultValue : val
  }

  set value (newVal) {
    this._object[this._key] = newVal
  }
}

export function ref (value) {
  return createRef(value)
}

export function shallowRef (value) {
  return createRef(value, true)
}

function createRef (rawValue, shallow = false) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}

export function isRef (value) {
  return !!(value && value.__mpx_isRef)
}

/**
 * Returns the inner value if the argument is a ref, otherwise return the
 * argument itself. This is a sugar function for
 * `val = isRef(val) ? val.value : val`.
 *
 * @example
 * ```js
 * function useFoo(x: number | Ref<number>) {
 *   const unwrapped = unref(x)
 *   // unwrapped is guaranteed to be number now
 * }
 * ```
 *
 * @param ref - Ref or plain value to be converted into the plain value.
 */
export function unref (ref) {
  return isRef(ref) ? ref.value : ref
}

export function toRef (source, key, defaultValue) {
  if (isRef(source)) {
    return source
  } else if (isFunction(source)) {
    return new GetterRefImpl(source)
  } else if (isObject(source) && arguments.length > 1) {
    return propertyToRef(source, key, defaultValue)
  } else {
    return ref(source)
  }
}

function propertyToRef (source, key) {
  const val = source[key]
  return isRef(val) ? val : new ObjectRefImpl(source, key)
}

/**
 * Converts a reactive object to a plain object where each property of the
 * resulting object is a ref pointing to the corresponding property of the
 * original object. Each individual ref is created using {@link toRef()}.
 *
 * @param object - Reactive object to be made into an object of linked refs.
 */
export function toRefs (object) {
  if (__DEV__ && !isReactive(object)) {
    console.warn('toRefs() expects a reactive object but received a plain one.')
  }
  if (!isPlainObject(object) || !isArray(object)) return object

  const result = isArray(object) ? new Array(object.length) : {}
  Object.keys(object).forEach((key) => {
    result[key] = toRef(object, key)
  })
  return result
}

/**
 * Normalizes values / refs / getters to values.
 * This is similar to {@link unref()}, except that it also normalizes getters.
 * If the argument is a getter, it will be invoked and its return value will
 * be returned.
 *
 * @example
 * ```js
 * toValue(1) // 1
 * toValue(ref(1)) // 1
 * toValue(() => 1) // 1
 * ```
 *
 * @param source - A getter, an existing ref, or a non-function value.
 */
export function toValue (source) {
  return isFunction(source) ? source() : unref(source)
}
