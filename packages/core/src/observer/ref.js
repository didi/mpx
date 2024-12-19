import { reactive, shallowReactive, set, isReactive, setForceTrigger } from './reactive'
import { RefKey } from '../helper/const'
import {
  warn,
  isPlainObject,
  hasOwn,
  extend
} from '@mpxjs/utils'

export class RefImpl {
  constructor (options) {
    Object.defineProperty(this, 'value', extend({ enumerable: true }, options))
  }
}

export function createRef (options, effect) {
  const ref = new RefImpl(options)
  if (effect) {
    ref.effect = effect
    effect.computed = ref
  }
  return Object.seal(ref)
}

export function isRef (val) {
  return val instanceof RefImpl
}

export function unref (ref) {
  return isRef(ref) ? ref.value : ref
}

export function ref (raw) {
  if (isRef(raw)) return raw
  const wrapper = reactive({ [RefKey]: raw })
  return createRef({
    get: () => wrapper[RefKey],
    set: (val) => {
      wrapper[RefKey] = val
    }
  })
}

export function toRef (obj, key) {
  if (!isReactive(obj)) warn('toRef() expects a reactive object but received a plain one.')
  if (!hasOwn(obj, key)) set(obj, key)
  const val = obj[key]
  if (isRef(val)) return val
  return createRef({
    get: () => obj[key],
    set: (val) => {
      obj[key] = val
    }
  })
}

export function toRefs (obj) {
  if (!isReactive(obj)) warn('toRefs() expects a reactive object but received a plain one.')
  if (!isPlainObject(obj)) return obj
  const result = {}
  Object.keys(obj).forEach((key) => {
    result[key] = toRef(obj, key)
  })
  return result
}

export function customRef (factory) {
  const version = ref(0)
  return createRef(
    factory(
      // track
      () => version.value,
      // trigger
      () => {
        version.value++
      }
    )
  )
}

export function shallowRef (raw) {
  if (isRef(raw)) return raw
  const wrapper = shallowReactive({ [RefKey]: raw })
  return createRef({
    get: () => wrapper[RefKey],
    set: (val) => {
      wrapper[RefKey] = val
    }
  })
}

export function triggerRef (ref) {
  if (!isRef(ref)) return
  setForceTrigger(true)
  /* eslint-disable no-self-assign */
  ref.value = ref.value
  setForceTrigger(false)
}
