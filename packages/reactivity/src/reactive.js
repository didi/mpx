import { isObject, type, def, isArray, isIntegerKey } from '@mpxjs/utils'
import { mutableHandlers, shallowReactiveHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers'

export const reactiveMap = new WeakMap()
export const shallowReactiveMap = new WeakMap()
export const readonlyMap = new WeakMap()
export const shallowReadonlyMap = new WeakMap()

export function reactive (target) {
  if (isReadonly(target)) {
    return target
  }
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

export function shallowReactive (target) {
  if (isReadonly(target)) {
    return target
  }
  return createReactiveObject(target, shallowReactiveHandlers, shallowReactiveMap)
}

export function readonly (target) {
  return createReactiveObject(target, readonlyHandlers, readonlyMap)
}

export function shallowReadonly (target) {
  return createReactiveObject(target, shallowReadonlyHandlers, shallowReadonlyMap)
}

export function isProxy (target) {
  return isReactive(target) || isReadonly(target)
}

export const ReactiveFlags = {
  SKIP: '__mpx_skip',
  IS_REACTIVE: '__mpx_isReactive',
  IS_READONLY: '__mpx_isReadonly',
  IS_SHALLOW: '__mpx_isShallow',
  RAW: '__mpx_raw'
}

const TargetType = {
  INVALID: 0,
  COMMON: 1
}

function getTargetType (value) {
  return value[ReactiveFlags.SKIP] || !Object.isExtensible(value)
    ? TargetType.INVALID
    : targetTypeMap(type(value))
}

function targetTypeMap (rawType) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    default:
      return TargetType.INVALID
  }
}

function createReactiveObject (target, baseHandlers, proxyMap) {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
    }
    return target
  }
  // when target is already a Proxy, return it
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // target already has corresponding Proxy
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // only specific value types can be observed.
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }
  // only Object or Array type can be observed.
  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  return proxy
}

export function isReactive (value) {
  if (isReadonly(value)) {
    return isReactive(value[ReactiveFlags.RAW])
  }
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

export function isReadonly (value) {
  return !!(value && value[ReactiveFlags.IS_READONLY])
}

export function isShallow (value) {
  return !!(value && value[ReactiveFlags.IS_SHALLOW])
}

export function toRaw (observed) {
  const raw = observed && observed[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}

/**
 * Marks an object so that it will never be converted to a proxy. Returns the
 * object itself.
 * The value shouldn‘t be reactive in some scenes，such as complex third-party class instances or Mpx component objects.
 * Skipping the proxy transformation improves performance when rendering large lists of immutable data sources.
 *
 * @example
 * ```js
 * const foo = markRaw({})
 * console.log(isReactive(reactive(foo))) // false
 *
 * // also works when nested inside other reactive objects
 * const bar = reactive({ foo })
 * console.log(isReactive(bar.foo)) // false
 * ```
 * @param value - The object to be marked as "raw".
 */
export function markRaw (value) {
  def(value, ReactiveFlags.SKIP, true)
  return value
}

export function toReactive (value) {
  return isObject(value) ? reactive(value) : value
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 * Forward Compatibility
 */
export function set (target, key, val) {
  if (isReactive(target)) {
    target[key] = val
    return val
  }
  if (__DEV__) {
    console.warn(`${target} is not a reactive object`)
    target && (target[key] = val)
    return val
  }
}

/**
 * Delete a property and trigger change if necessary.
 * Forward Compatibility
 */
export function del (target, key) {
  if (isReactive(target)) {
    return delete target[key]
  }
  if (__DEV__ && target) {
    console.warn(`${target} is not a reactive object`)
    return delete target[key]
  }
}
