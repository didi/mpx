import { isFunction, noop } from '@mpxjs/utils'
import Dep from './dep'
import { createRef } from './ref'
import { ReactiveEffect, isTracking } from './effect'

export function computed (getterOrOptions, debugOptions) {
  let getter, setter
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = noop
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  // 复用createRef创建computedRef，使用闭包变量存储dirty/value/effect
  let dirty = true
  let value
  const effect = new ReactiveEffect(getter, () => {
    dirty = true
  })
  if (process.env.NODE_ENV !== 'production' && debugOptions) {
    effect.onTrack = debugOptions.onTrack
    effect.onTrigger = debugOptions.onTrigger
  }

  const ref = createRef({
    get: () => {
      if (dirty) {
        value = effect.run()
        dirty = false
      }
      if (Dep.target) {
        if (process.env.NODE_ENV !== 'production' && isTracking() && Dep.target.onTrack) {
          Dep.target.invokeDebuggerHook('onTrack', { target: ref, type: 'get', key: 'value' })
        }
        effect.depend()
      }
      return value
    },
    set: (val) => {
      setter(val)
    }
  }, effect)
  return ref
}
