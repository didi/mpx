import {
  reactive,
  shallowReactive,
  set,
  isReactive,
  setForceTrigger
} from './reactive'
import Dep from './dep'
import { ObKey, RefKey } from '../helper/const'
import {
  warn,
  isPlainObject,
  hasOwn,
  extend
} from '@mpxjs/utils'

const profiledRefs = new WeakSet()
let hasProfiledRefs = false
let currentTriggerRef

function runWithTriggerRef (ref, fn, value) {
  if (!hasProfiledRefs || !profiledRefs.has(ref)) return fn.call(ref, value)
  const previousTriggerRef = currentTriggerRef
  currentTriggerRef = ref
  try {
    return fn.call(ref, value)
  } finally {
    currentTriggerRef = previousTriggerRef
  }
}

export class RefImpl {
  constructor (options) {
    const descriptor = extend({ enumerable: true }, options)
    if (descriptor.get) {
      const getter = descriptor.get
      descriptor.get = () => {
        const value = getter.call(this)
        const target = Dep.target
        if (target?.refTriggerDeps) {
          target.trackRefTriggerValue(value, [this])
          const observer = value && typeof value === 'object' ? value[ObKey] : undefined
          if (observer && target.newDepIds.has(observer.dep.id)) {
            target.addRefTriggerDeps(observer.dep, [this])
          }
          if (Array.isArray(value)) target.trackRefTriggerArray?.(value, [this])
        }
        return value
      }
    }
    if (descriptor.set) {
      const setter = descriptor.set
      descriptor.set = (value) => runWithTriggerRef(this, setter, value)
    }
    Object.defineProperty(this, 'value', descriptor)
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

// Render profiler only: enable transient ref identity metadata for a setup ref.
// The business-facing key remains scoped to the owning component profiler state.
export function trackRefTrigger (ref) {
  if (isRef(ref)) {
    hasProfiledRefs = true
    profiledRefs.add(ref)
  }
}

export function getCurrentTriggerRef () {
  return currentTriggerRef
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
  let custom = null
  const triggerVersion = () => {
    version.value++
  }
  const options = factory(
    // track
    () => version.value,
    // trigger; retain the outer custom ref identity even when called async.
    () => runWithTriggerRef(custom, triggerVersion)
  )
  custom = createRef(options)
  return custom
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
