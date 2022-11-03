import { isFunction, noop } from '@mpxjs/utils'
import Dep from './dep'
import { createRef } from './ref'
import { ReactiveEffect } from './effect'

export function computed (getterOrOptions) {
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

  return createRef({
    get: () => {
      if (dirty) {
        value = effect.run()
        dirty = false
      }
      if (Dep.target) {
        effect.depend()
      }
      return value
    },
    set: (val) => {
      setter(val)
    }
  }, effect)
}
