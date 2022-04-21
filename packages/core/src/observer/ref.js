import { reactive, shallowReactive, set, isReactive, setForceTrigger } from 'reactive'
import { RefKey } from '../helper/const'
import { hasOwn, isPlainObject } from '../helper/utils'
import { warn } from '../helper/log'

class RefImpl {
  constructor (options, isComputed) {
    Object.defineProperty(this, 'value', options)
    if (isComputed) this.effect = true
  }
}

export function createRef (options, isComputed) {
  const ref = new RefImpl(options, isComputed)
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
  if (!isReactive(obj)) warn(`toRef() expects a reactive object but received a plain one.`)
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
  if (!isReactive(obj)) warn(`toRefs() expects a reactive object but received a plain one.`)
  if (!isPlainObject(obj)) return obj
  const result = {}
  Object.keys(obj).forEach((key) => {
    result[key] = toRef(obj, key)
  })
  return result
}

export function customRef () {
  const version = ref(0)
  return createRef(
    factory(
      () => version.value,
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
  ref.value = ref.value
  setForceTrigger(false)
}


