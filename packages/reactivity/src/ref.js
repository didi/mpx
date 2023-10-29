import { isFunction, isObject, isArray, hasChanged } from '@mpxjs/utils'
import {
  shouldTrack,
  activeEffect,
  trackEffects,
  triggerEffects
} from './effect'
import {
  isReactive,
  toRaw,
  toReactive,
  isShallow,
  isReadonly
} from './reactive'
import { createDep } from './dep'

class RefImpl {
  __mpx_isRef = true;
  dep = undefined;
  constructor (value, shallow = false) {
    this._rawValue = shallow ? value : toRaw(value)
    this.__mpx_isShallow = shallow
    this._value = shallow ? value : toReactive(value)
  }

  get value () {
    trackRefValue(this)
    return this._value
  }

  set value (newVal) {
    const useDirectValue =
      this.__mpx_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = useDirectValue ? newVal : toReactive(newVal)
      triggerRefValue(this, newVal)
    }
  }
}

/**
 * Force trigger effects that depends on a shallow ref. This is typically used
 * after making deep mutations to the inner value of a shallow ref.
 *
 * @example
 * ```js
 * const shallow = shallowRef({
 *   greet: 'Hello, world'
 * })
 *
 * // Logs "Hello, world" once for the first run-through
 * effect(() => {
 *   console.log(shallow.value.greet)
 * })
 *
 * // This won't trigger the effect because the ref is shallow
 * shallow.value.greet = 'Hello, universe'
 *
 * // Logs "Hello, universe"
 * triggerRef(shallow)
 * ```
 *
 * @param ref - The ref whose tied effects shall be executed.
 */
export function triggerRef (ref) {
  // eslint-disable-next-line no-void
  triggerRefValue(ref, __DEV__ ? ref.value : void 0)
}

export function trackRefValue (ref) {
  ref = toRaw(ref)
  if (shouldTrack && activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

export function triggerRefValue (ref) {
  ref = toRaw(ref)
  const dep = ref.dep
  if (dep) {
    triggerEffects(dep)
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

class CustomRefImpl {
  dep = undefined;
  __mpx_isRef = true;
  constructor (factory) {
    const { get, set } = factory(
      () => trackRefValue(this),
      () => triggerRefValue(this)
    )
    this._get = get
    this._set = set
  }

  get value () {
    return this._get()
  }

  set value (newVal) {
    return this._set(newVal)
  }
}

/**
 * Creates a customized ref with explicit control over its dependency tracking
 * and updates triggering.
 *
 * @param factory - The function that receives the `track` and `trigger` callbacks.
 */
export function customRef (factory) {
  return new CustomRefImpl(factory)
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

function propertyToRef (source, key, defaultValue) {
  const val = source[key]
  return isRef(val) ? val : new ObjectRefImpl(source, key, defaultValue)
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
    console.warn(
      'toRefs() expects a reactive object but received a plain one.'
    )
  }

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
