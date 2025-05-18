import {
  arrayProtoAugment,
  def,
  hasChanged,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isValidArrayIndex
} from '@mpxjs/utils'
import { arrayMethods } from './array'
import { ObKey } from './const'
import { Dep } from './dep'
import { Ref, UnwrapRefSimple, isRef } from './ref'

export interface Target {
  [ObKey]?: Observer
}

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
const rawSet = new WeakSet()

let isForceTrigger = false

export function setForceTrigger(val: boolean): void {
  isForceTrigger = val
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
export class Observer {
  dep = new Dep()

  constructor(
    public value: any,
    public shallow = false
  ) {
    def(value, ObKey, this)
    if (Array.isArray(value)) {
      const augment = hasProto && arrayProtoAugment ? protoAugment : copyAugment
      augment(value, arrayMethods, arrayKeys)
      !shallow && this._observeArray(value)
    } else {
      this._walk(value, shallow)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  private _walk(obj: Record<string, any>, shallow?: boolean): void {
    Object.keys(obj).forEach((key: string) => {
      defineReactive(obj, key, obj[key], shallow)
    })
  }

  /**
   * Observe a list of Array items.
   */
  private _observeArray(arr: any[]): void {
    for (let i = 0, l = arr.length; i < l; i++) {
      observe(arr[i])
    }
  }
}

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment(target: any, src: any): void {
  // eslint-disable-next-line no-proto
  target.__proto__ = src
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
function copyAugment(target: any[], src: any, keys: string[]): void {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe(value: any, shallow?: boolean): Observer | undefined {
  if (!isObject(value) || rawSet.has(value)) {
    return
  }
  let ob = getObserver(value)
  if (
    !ob &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value)
  ) {
    ob = new Observer(value, shallow)
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
export function defineReactive(
  obj: object,
  key: string,
  val?: any,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set

  let childOb = shallow ? getObserver(val) : observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return !shallow && isRef(value) ? value.value : value
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val
      if (!(shallow && isForceTrigger) && !hasChanged(newVal, value)) {
        return
      }
      if (!shallow && isRef(value) && !isRef(newVal)) {
        value.value = newVal
      } else if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = shallow ? getObserver(newVal) : observe(newVal)
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set<T>(array: T[], key: number, value: T): T
export function set<T>(object: object, key: string | number, value: T): T
export function set(
  target: any[] | Record<string, any>,
  key: any,
  val: any
): any {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (hasOwn(target, key)) {
    target[key as keyof typeof target] = val
    return val
  }
  const ob = getObserver(target)
  if (!ob) {
    target[key as keyof typeof target] = val
    return val
  }
  defineReactive(ob.value, key, val, ob.shallow)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del<T>(array: T[], key: number): void
export function del(object: object, key: string | number): void
export function del(target: any[] | object, key: any) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = getObserver(target)
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key as keyof typeof target]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray(arr: any[]) {
  for (let i = 0, l = arr.length; i < l; i++) {
    const item = arr[i]
    const ob = getObserver(item)
    ob && ob.dep.depend()
    if (Array.isArray(item)) {
      dependArray(item)
    }
  }
}

// only unwrap nested ref
export type UnwrapNestedRefs<T> = T extends Ref ? T : UnwrapRefSimple<T>

export function reactive<T extends object>(target: T): UnwrapNestedRefs<T>
export function reactive(target: object) {
  observe(target)
  return target
}

export declare const ShallowReactiveMarker: unique symbol

export type ShallowReactive<T> = T & { [ShallowReactiveMarker]?: true }

export function shallowReactive<T extends object>(
  target: T
): ShallowReactive<T> {
  observe(target, true)
  return target
}

export function isReactive(value: unknown): boolean {
  return !!(
    value &&
    hasOwn(value, ObKey) &&
    (value as Target)[ObKey] instanceof Observer
  )
}

export function getObserver(value: any) {
  if (isReactive(value)) return (value as Target)[ObKey]
}

export function markRaw<T extends object>(value: T): T {
  if (isObject(value)) {
    rawSet.add(value)
  }
  return value
}
