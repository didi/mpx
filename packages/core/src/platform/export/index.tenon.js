import {
  effectScope as vueEffectScope,
  getCurrentScope as getCurrentVueScope,
  onScopeDispose
} from '@hummer/tenon-vue'

import {
  hasOwn,
  isValidArrayIndex
} from '@mpxjs/utils'

export {
  // watch
  watchEffect,
  watchSyncEffect,
  watchPostEffect,
  watch,
  // reactive
  reactive,
  isReactive,
  shallowReactive,
  markRaw,
  // ref
  ref,
  unref,
  toRef,
  toRefs,
  isRef,
  customRef,
  shallowRef,
  triggerRef,
  // computed
  computed,
  // instance
  getCurrentInstance,
  provide,
  inject
} from '@hummer/tenon-vue'

export function set (target, key, val) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  target[key] = val
  return val
}

export function del (target, key) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
}

const noop = () => {
}

const fixEffectScope = (scope) => {
  scope.pause = noop
  scope.resume = noop
  return scope
}

const effectScope = (detached) => fixEffectScope(vueEffectScope(detached))
const getCurrentScope = () => fixEffectScope(getCurrentVueScope())

export {
  // effectScope
  effectScope,
  getCurrentScope,
  onScopeDispose
}
