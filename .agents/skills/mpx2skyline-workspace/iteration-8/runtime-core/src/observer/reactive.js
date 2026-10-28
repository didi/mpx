import Dep from './dep'
import { arrayMethods } from './array'
import { ObKey } from '../helper/const'
import { isRef } from './ref'
import {
  hasOwn,
  isObject,
  isPlainObject,
  hasProto,
  def,
  isValidArrayIndex,
  arrayProtoAugment,
  hasChanged
} from '@mpxjs/utils'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

const rawSet = new WeakSet()

let isForceTrigger = false

export function setForceTrigger (val) {
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

  constructor (value, shallow) {
    this.value = value
    this.shallow = shallow
    def(value, ObKey, this)
    if (Array.isArray(value)) {
      const augment = hasProto && arrayProtoAugment
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      !shallow && this.observeArray(value)
    } else {
      this.walk(value, shallow)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj, shallow) {
    Object.keys(obj).forEach((key) => {
      defineReactive(obj, key, obj[key], shallow)
    })
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (arr) {
    for (let i = 0, l = arr.length; i < l; i++) {
      observe(arr[i])
    }
  }
}

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src, keys) {
  /* eslint-disable no-proto */
  target.__proto__ = src
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */

/* istanbul ignore next */
function copyAugment (target, src, keys) {
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
function observe (value, shallow) {
  if (!isObject(value) || rawSet.has(value)) {
    return
  }
  let ob = getObserver(value)
  if (!ob && (Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value)) {
    ob = new Observer(value, shallow)
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
export function defineReactive (obj, key, val, shallow) {
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
    get: function reactiveGetter () {
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
    set: function reactiveSetter (newVal) {
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
export function set (target, key, val) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (hasOwn(target, key)) {
    target[key] = val
    return val
  }
  const ob = getObserver(target)
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val, ob.shallow)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target, key) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = getObserver(target)
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (arr) {
  for (let i = 0, l = arr.length; i < l; i++) {
    const item = arr[i]
    const ob = getObserver(item)
    ob && ob.dep.depend()
    if (Array.isArray(item)) {
      dependArray(item)
    }
  }
}

export function reactive (value) {
  observe(value)
  return value
}

export function shallowReactive (value) {
  observe(value, true)
  return value
}

export function isReactive (value) {
  return hasOwn(value, ObKey) && value[ObKey] instanceof Observer
}

export function getObserver (value) {
  if (isReactive(value)) return value[ObKey]
}

export function markRaw (value) {
  if (isObject(value)) {
    rawSet.add(value)
  }
  return value
}
